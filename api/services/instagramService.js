var puppeteer = require("puppeteer-core");
var chromium = require("chrome-aws-lambda");
const apiPrefix = 'https://www.instagram.com/api/v1/media';


const LOCAL_CHROME_EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const login = async(page, username, password)=>{
    await page.goto("https://www.instagram.com/accounts/login/",{
      waitUntil:"domcontentloaded",
      timeout:0
  })
    await page.waitForTimeout(5000); // wait for 5 seconds
    await page.type('input[name=username]', username);
    await page.type('input[name=password]', password);
    await page.evaluate(() => {
            document.querySelector('button[type=submit]').click();
    });
    await page.waitForTimeout(5000); // wait for 5 seconds
}

// This is where we'll put the code to get around the tests.
const preparePageForTests = async (page) => {

  // Pass the User-Agent Test.
  const userAgent = 'Mozilla/5.0 (X11; Linux x86_64)' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
  await page.setUserAgent(userAgent);
}


const debuggerConsole = (page)=>{
  page.on('console', async (msg) => {
    const msgArgs = msg.args();
    for (let i = 0; i < msgArgs.length; ++i) {
      console.log(await msgArgs[i].jsonValue());
    }
  });
}   

const loadAllComments = async(page, post)=>{
  let responses = [];

  const [res] = await Promise.all([
  page.waitForResponse(res => res.url().includes(apiPrefix), {timeout: 90000}),
   page.goto(post, {
        timeout: 0,
        waitUntil:"domcontentloaded"
    })
  ]);
  const data = await res.json();
  const comments = data?.comments || [];
  responses = [...responses, ...comments]
  await page.waitForTimeout(5000); // wait for 5 seconds
 
  let buttons = await page.$$(".x9f619 > button:nth-child(1)");
  let index = null;

  for(let i= 0; i<buttons.length; i++){
    const text = await page.evaluate(element => element.textContent, buttons[i]);
    if(text ==="Load more comments"){
      index = i;
    }
  }


  while(index){
    await buttons[index].click();
    const res = await page.waitForResponse(res => res.url().includes(apiPrefix), {timeout: 90000});
    const data = await res.json();    
   const comments = data?.comments || [];
    responses = [...responses, ...comments]
    buttons = await page.$$(".x9f619 > button:nth-child(1)");
    let isNull = true;
    for(let i= 0; i<buttons.length; i++){
      const text = await page.evaluate(element => element.textContent, buttons[i]);
      if(text ==="Load more comments"){
        index = i;
        isNull = false;
        
      }
    }
    if(isNull){
      index = null;
    }
  }


  return responses;
  
}

const processData = (comments)=>{
    const mapUser = {

    }

    comments.forEach((item)=>{
      if(mapUser[item.user.username]){
        let current = mapUser[item.user.username];
        current = current +1;
        mapUser[item?.user.username] = current;

      }
      else{
      mapUser[item?.user.username] = 1;
      }

    })

    const processedData = comments.map((item)=>{
      return {
        created_date:new Date(parseInt(`${item?.created_at_utc}`+'000')).toLocaleString(),
        username:item?.user?.username || "-",
        text:item?.text || "-",
        total_this_user_comments_in_this_post:mapUser[item?.user?.username],
        total_reply:item?.child_comment_count,
        total_like:item?.comment_like_count,     
      }
    })
    return processedData;

}

exports.main = async (username, password, post) => {
    const executablePath = await chromium.executablePath || LOCAL_CHROME_EXECUTABLE;
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    executablePath,
   args: [
        ...chromium.args,
        "--autoplay-policy=user-gesture-required",
        "--disable-background-networking",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-breakpad",
        "--disable-client-side-phishing-detection",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-dev-shm-usage",
        "--disable-domain-reliability",
        "--disable-extensions",
        "--disable-features=AudioServiceOutOfProcess",
        "--disable-hang-monitor",
        "--disable-ipc-flooding-protection",
        "--disable-notifications",
        "--disable-offer-store-unmasked-wallet-cards",
        "--disable-popup-blocking",
        "--disable-print-preview",
        "--disable-prompt-on-repost",
        "--disable-renderer-backgrounding",
        "--disable-setuid-sandbox",
        "--disable-speech-api",
        "--disable-sync",
        "--hide-scrollbars",
        "--ignore-gpu-blacklist",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-first-run",
        "--no-pings",
        "--no-sandbox",
        "--no-zygote",
        "--password-store=basic",
        "--use-gl=swiftshader",
        "--use-mock-keychain",
      ],
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();
  await preparePageForTests(page);

  // Turn on debugger
  debuggerConsole(page);

  // Go to login page
  await login(page, username, password);  
  

  // Go to spesific post and load comments
  const comments = await loadAllComments(page, post);


  // Data processing
  const processedData = processData(comments);


  await browser.close();

  return processedData || [];

 
}
