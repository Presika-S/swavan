/*!
 * SwastiQ i18n engine  (framework-agnostic: works with plain JS, React, Vue…)
 *
 * What it does
 *  - Translates the WHOLE app (text nodes + placeholder/title/aria-label/alt/button value)
 *    whenever a language is chosen, including text that your code renders later.
 *  - Source strings are the ENGLISH text itself, so you do NOT have to edit every component.
 *  - Skips the login page and anything marked data-no-i18n (patient names, user data…).
 *  - Falls back to English for any string that has no translation yet.
 *  - I18N.missing() lists every English string still untranslated on screen.
 *
 * Usage
 *  <script src="/i18n.js"></script>          (load it BEFORE your app bundle)
 *  I18N.setLang('hi')                        (from your language button / menu)
 *  I18N.t('Contact the PHC immediately.')    (for toasts, alerts, voice/TTS prompts)
 *  I18N.t('Welcome Back, {name}', {name: 'Presika'})
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ config */
  var STORAGE_KEY = 'swastiq_lang';
  var cfg = {
    // Pages/areas that must stay English (login). Edit to match your routes.
    skipPage: function () {
      return /\/(login|signin|sign-in|auth)\b/i.test(location.pathname + location.hash);
    },
    skipElement: function (el) {
      return !!el.closest('[data-no-i18n], #login, .login, .login-page, [data-page="login"]');
    }
  };

  // Order of the positional arrays in A(...) below
  var ORDER = ['ta', 'hi', 'mr', 'gu', 'te', 'kn', 'ml'];

  var LANGUAGES = [
    { code: 'ta', name: 'Tamil',     native: 'தமிழ்',      locale: 'ta-IN' },
    { code: 'hi', name: 'Hindi',     native: 'हिन्दी',      locale: 'hi-IN' },
    { code: 'te', name: 'Telugu',    native: 'తెలుగు',     locale: 'te-IN' },
    { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ',      locale: 'kn-IN' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം',    locale: 'ml-IN' },
    { code: 'mr', name: 'Marathi',   native: 'मराठी',      locale: 'mr-IN' },
    { code: 'gu', name: 'Gujarati',  native: 'ગુજરાતી',    locale: 'gu-IN' },
    { code: 'en', name: 'English',   native: 'English',   locale: 'en-IN' }
  ];

  /* -------------------------------------------------------------- dictionary */
  var DICT = {};      // normalized English -> {ta:..., hi:...}
  var PATTERNS = [];  // strings containing {n} / {name} placeholders

  function norm(s) {
    return String(s).replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function register(en, entry) {
    if (/\{\w+\}/.test(en)) {
      var names = [];
      var src = en.split(/(\{\w+\})/).map(function (p) {
        var m = /^\{(\w+)\}$/.exec(p);
        if (!m) return escRe(p.replace(/[\u2018\u2019]/g, "'"));
        names.push(m[1]);
        return m[1] === 'n' ? '(\\d+)' : '(.+?)';
      }).join('');
      PATTERNS.push({ re: new RegExp('^' + src + '$', 'i'), names: names, entry: entry });
    } else {
      DICT[norm(en)] = entry;
    }
  }

  // A("English", [ta, hi, mr, gu, te, kn, ml])
  function A(en, arr) {
    var e = {};
    ORDER.forEach(function (c, i) { if (arr[i]) e[c] = arr[i]; });
    register(en, e);
  }

  /* ---- Sidebar / navigation ---- */
  A("Dashboard", ["டாஷ்போர்டு","डैशबोर्ड","डॅशबोर्ड","ડેશબોર્ડ","డాష్‌బోర్డ్","ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","ഡാഷ്ബോർഡ്"]);
  A("Voice Assistant", ["குரல் உதவியாளர்","वॉइस असिस्टेंट","व्हॉइस असिस्टंट","વૉઇસ આસિસ્ટન્ટ","వాయిస్ అసిస్టెంట్","ವಾಯ್ಸ್ ಅಸಿಸ್ಟೆಂಟ್","വോയ്സ് അസിസ്റ്റന്റ്"]);
  A("Records", ["பதிவேடு","रिकॉर्ड","नोंदी","રેકોર્ડ","రికార్డులు","ದಾಖಲೆಗಳು","രേഖകൾ"]);
  A("Beneficiaries", ["பயனாளிகள்","लाभार्थी","लाभार्थी","લાભાર્થીઓ","లబ్ధిదారులు","ಫಲಾನುಭವಿಗಳು","ഗുണഭോക്താക്കൾ"]);
  A("Follow-up", ["பின்தொடர்தல்","फॉलो-अप","पाठपुरावा","ફોલો-અપ","ఫాలో-అప్","ಫಾಲೋ-ಅಪ್","ഫോളോ-അപ്പ്"]);
  A("Alerts", ["எச்சரிக்கைகள்","अलर्ट","सूचना","ચેતવણીઓ","హెచ్చరికలు","ಎಚ್ಚರಿಕೆಗಳು","മുന്നറിയിപ്പുകൾ"]);
  A("PHC Referrals", ["PHC பரிந்துரைகள்","PHC रेफ़रल","PHC संदर्भ","PHC રેફરલ","PHC రెఫరల్స్","PHC ರೆಫರಲ್‌ಗಳು","PHC റഫറലുകൾ"]);
  A("Reports", ["அறிக்கைகள்","रिपोर्ट","अहवाल","અહેવાલો","నివేదికలు","ವರದಿಗಳು","റിപ്പോർട്ടുകൾ"]);
  A("Settings", ["அமைப்புகள்","सेटिंग्स","सेटिंग्ज","સેટિંગ્સ","సెట్టింగ్‌లు","ಸೆಟ್ಟಿಂಗ್‌ಗಳು","ക്രമീകരണങ്ങൾ"]);

  /* ---- Status / header ---- */
  A("Waiting to sync", ["ஒத்திசைவுக்காக காத்திருக்கிறது","सिंक की प्रतीक्षा","सिंकची प्रतीक्षा","સિંકની રાહ જોઈ રહ્યું છે","సింక్ కోసం వేచి ఉంది","ಸಿಂಕ್‌ಗಾಗಿ ಕಾಯುತ್ತಿದೆ","സിങ്കിനായി കാത്തിരിക്കുന്നു"]);
  A("Synced", ["ஒத்திசைக்கப்பட்டது","सिंक हो गया","सिंक झाले","સિંક થયું","సింక్ అయింది","ಸಿಂಕ್ ಆಗಿದೆ","സിങ്ക് ചെയ്തു"]);
  A("System ready", ["அமைப்பு தயார்","सिस्टम तैयार","प्रणाली सज्ज","સિસ્ટમ તૈયાર","సిస్టమ్ సిద్ధంగా ఉంది","ವ್ಯವಸ್ಥೆ ಸಿದ್ಧವಾಗಿದೆ","സിസ്റ്റം തയ്യാർ"]);
  A("Online", ["ஆன்லைன்","ऑनलाइन","ऑनलाइन","ઓનલાઇન","ఆన్‌లైన్","ಆನ್‌ಲೈನ್","ഓൺലൈൻ"]);
  A("Offline", ["ஆஃப்லைன்","ऑफ़लाइन","ऑफलाइन","ઓફલાઇન","ఆఫ్‌లైన్","ಆಫ್‌ಲೈನ್","ഓഫ്‌ലൈൻ"]);

  /* ---- Dashboard ---- */
  A("Welcome Back, {name}", ["மீண்டும் வருக, {name}","वापसी पर स्वागत है, {name}","पुन्हा स्वागत, {name}","ફરી સ્વાગત છે, {name}","తిరిగి స్వాగతం, {name}","ಮರಳಿ ಸ್ವಾಗತ, {name}","വീണ്ടും സ്വാഗതം, {name}"]);
  A("Every Visit Matters. Every Life Counts.", ["ஒவ்வொரு வருகையும் முக்கியம். ஒவ்வொரு உயிரும் மதிப்புமிக்கது.","हर मुलाकात मायने रखती है। हर जीवन अनमोल है।","प्रत्येक भेट महत्त्वाची आहे. प्रत्येक जीव मोलाचा आहे.","દરેક મુલાકાત મહત્વની છે. દરેક જીવન કિંમતી છે.","ప్రతి సందర్శన ముఖ్యమే. ప్రతి ప్రాణం విలువైనదే.","ಪ್ರತಿ ಭೇಟಿಯೂ ಮುಖ್ಯ. ಪ್ರತಿ ಜೀವವೂ ಅಮೂಲ್ಯ.","ഓരോ സന്ദർശനവും പ്രധാനമാണ്. ഓരോ ജീവനും വിലപ്പെട്ടതാണ്."]);
  A("Community Pulse", ["சமூக நாடித்துடிப்பு","समुदाय की नब्ज़","समुदायाची स्पंदने","સમુદાય પલ્સ","సమాజ నాడి","ಸಮುದಾಯ ನಾಡಿಮಿಡಿತ","സമൂഹ സ്പന്ദനം"]);
  A("Immediate Attention", ["உடனடி கவனம்","तत्काल ध्यान","तातडीचे लक्ष","તાત્કાલિક ધ્યાન","తక్షణ శ్రద్ధ","ತಕ್ಷಣದ ಗಮನ","അടിയന്തര ശ്രദ്ധ"]);
  A("{n} overdue", ["{n} காலதாமதம்","{n} विलंबित","{n} मुदतबाह्य","{n} મુદત વીતી","{n} గడువు మించినవి","{n} ಗಡುವು ಮೀರಿದ","{n} കാലാവധി കഴിഞ്ഞവ"]);
  A("{n} active alerts", ["{n} செயலில் உள்ள எச்சரிக்கைகள்","{n} सक्रिय अलर्ट","{n} सक्रिय सूचना","{n} સક્રિય ચેતવણીઓ","{n} క్రియాశీల హెచ్చరికలు","{n} ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು","{n} സജീവ മുന്നറിയിപ്പുകൾ"]);
  A("{n} review needed", ["{n} மதிப்பாய்வு தேவை","{n} की समीक्षा आवश्यक","{n} पुनरावलोकन आवश्यक","{n} સમીક્ષા જરૂરી","{n} సమీక్ష అవసరం","{n} ಪರಿಶೀಲನೆ ಅಗತ್ಯ","{n} അവലോകനം ആവശ്യം"]);
  A("Ward {n}", ["வார்டு {n}","वार्ड {n}","प्रभाग {n}","વોર્ડ {n}","వార్డు {n}","ವಾರ್ಡ್ {n}","വാർഡ് {n}"]);
  A("{n} people", ["{n} பேர்","{n} लोग","{n} लोक","{n} લોકો","{n} మంది","{n} ಜನರು","{n} പേർ"]);
  A("{n} alert(s)", ["{n} எச்சரிக்கை(கள்)","{n} अलर्ट","{n} सूचना","{n} ચેતવણી","{n} హెచ్చరిక(లు)","{n} ಎಚ್ಚರಿಕೆ(ಗಳು)","{n} മുന്നറിയിപ്പ്"]);
  A("Total Beneficiaries", ["மொத்த பயனாளிகள்","कुल लाभार्थी","एकूण लाभार्थी","કુલ લાભાર્થીઓ","మొత్తం లబ్ధిదారులు","ಒಟ್ಟು ಫಲಾನುಭವಿಗಳು","ആകെ ഗുണഭോക്താക്കൾ"]);
  A("Today's Scheduled Visits", ["இன்றைய திட்டமிட்ட வருகைகள்","आज की निर्धारित मुलाकातें","आजच्या नियोजित भेटी","આજની નિર્ધારિત મુલાકાતો","నేటి షెడ్యూల్ చేసిన సందర్శనలు","ಇಂದಿನ ನಿಗದಿತ ಭೇಟಿಗಳು","ഇന്നത്തെ ഷെഡ്യൂൾ ചെയ്ത സന്ദർശനങ്ങൾ"]);
  A("Pending Follow-ups", ["நிலுவையில் உள்ள பின்தொடர்தல்கள்","लंबित फॉलो-अप","प्रलंबित पाठपुरावा","બાકી ફોલો-અપ","పెండింగ్ ఫాలో-అప్‌లు","ಬಾಕಿ ಇರುವ ಫಾಲೋ-ಅಪ್‌ಗಳು","തീർപ്പാക്കാത്ത ഫോളോ-അപ്പുകൾ"]);
  A("Records Requiring Review", ["மதிப்பாய்வு தேவைப்படும் பதிவுகள்","समीक्षा योग्य रिकॉर्ड","पुनरावलोकन आवश्यक नोंदी","સમીક્ષા જરૂરી રેકોર્ડ","సమీక్ష అవసరమైన రికార్డులు","ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳು","അവലോകനം ആവശ്യമായ രേഖകൾ"]);
  A("Critical Alerts", ["முக்கிய எச்சரிக்கைகள்","गंभीर अलर्ट","गंभीर सूचना","ગંભીર ચેતવણીઓ","తీవ్రమైన హెచ్చరికలు","ಗಂಭೀರ ಎಚ್ಚರಿಕೆಗಳು","ഗുരുതര മുന്നറിയിപ്പുകൾ"]);
  A("Reviewed Visits", ["மதிப்பாய்வு செய்யப்பட்ட வருகைகள்","समीक्षित मुलाकातें","पुनरावलोकन केलेल्या भेटी","સમીક્ષા કરેલ મુલાકાતો","సమీక్షించిన సందర్శనలు","ಪರಿಶೀಲಿಸಿದ ಭೇಟಿಗಳು","അവലോകനം ചെയ്ത സന്ദർശനങ്ങൾ"]);
  A("Open", ["திற","खोलें","उघडा","ખોલો","తెరవండి","ತೆರೆಯಿರಿ","തുറക്കുക"]);

  /* ---- Smart Alert Center ---- */
  A("Smart Alert Center", ["ஸ்மார்ட் எச்சரிக்கை மையம்","स्मार्ट अलर्ट केंद्र","स्मार्ट सूचना केंद्र","સ્માર્ટ ચેતવણી કેન્દ્ર","స్మార్ట్ హెచ్చరిక కేంద్రం","ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆ ಕೇಂದ್ರ","സ്മാർട്ട് മുന്നറിയിപ്പ് കേന്ദ്രം"]);
  A("PHC dashboard", ["PHC டாஷ்போர்டு","PHC डैशबोर्ड","PHC डॅशबोर्ड","PHC ડેશબોર્ડ","PHC డాష్‌బోర్డ్","PHC ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","PHC ഡാഷ്ബോർഡ്"]);
  A("Test alert sounds", ["எச்சரிக்கை ஒலிகளைச் சோதிக்கவும்","अलर्ट ध्वनि जाँचें","सूचना ध्वनी तपासा","ચેતવણી અવાજ ચકાસો","హెచ్చరిక శబ్దాలను పరీక్షించండి","ಎಚ್ಚರಿಕೆ ಶಬ್ದಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ","മുന്നറിയിപ്പ് ശബ്ദങ്ങൾ പരിശോധിക്കുക"]);
  A("Critical open", ["திறந்துள்ள முக்கிய எச்சரிக்கைகள்","गंभीर (खुले)","गंभीर (खुल्या)","ગંભીર (ખુલ્લા)","తీవ్రమైనవి (తెరిచినవి)","ಗಂಭೀರ (ತೆರೆದಿರುವ)","ഗുരുതരം (തുറന്നത്)"]);
  A("Awaiting PHC", ["PHC-க்காக காத்திருப்பு","PHC की प्रतीक्षा","PHC च्या प्रतीक्षेत","PHC ની રાહ","PHC కోసం వేచి ఉంది","PHC ಗಾಗಿ ಕಾಯುತ್ತಿದೆ","PHC-യ്ക്കായി കാത്തിരിക്കുന്നു"]);
  A("To acknowledge", ["ஒப்புதல் அளிக்க வேண்டியவை","स्वीकार करने हेतु","मान्य करायचे","સ્વીકારવાના બાકી","అంగీకరించాల్సినవి","ಅಂಗೀಕರಿಸಬೇಕಾದವು","അംഗീകരിക്കേണ്ടവ"]);
  A("Cases closed", ["முடிக்கப்பட்ட வழக்குகள்","बंद किए गए मामले","बंद केलेली प्रकरणे","બંધ કરેલા કેસ","ముగించిన కేసులు","ಮುಕ್ತಾಯಗೊಂಡ ಪ್ರಕರಣಗಳು","അവസാനിപ്പിച്ച കേസുകൾ"]);
  A("Risk alerts are decision-support prompts. Critical danger signs require urgent assessment under the applicable health protocol. An in-app alert does not mean the PHC has received a referral.", [
    "ஆபத்து எச்சரிக்கைகள் முடிவெடுக்க உதவும் குறிப்புகள் மட்டுமே. கடுமையான ஆபத்து அறிகுறிகளுக்கு பொருந்தும் சுகாதார நெறிமுறையின்படி உடனடி மதிப்பீடு தேவை. செயலியில் எச்சரிக்கை காட்டப்படுவது PHC பரிந்துரையைப் பெற்றுள்ளது என்று அர்த்தமல்ல.",
    "जोखिम अलर्ट निर्णय-सहायता संकेत हैं। गंभीर खतरे के संकेतों में लागू स्वास्थ्य प्रोटोकॉल के अनुसार तत्काल मूल्यांकन आवश्यक है। ऐप में अलर्ट दिखने का अर्थ यह नहीं कि PHC को रेफ़रल मिल गया है।",
    "जोखीम सूचना या निर्णय-सहाय्य संकेत आहेत. गंभीर धोक्याच्या लक्षणांसाठी लागू आरोग्य प्रोटोकॉलनुसार तातडीचे मूल्यांकन आवश्यक आहे. अ‍ॅपमधील सूचना म्हणजे PHC ला संदर्भ मिळाला असा अर्थ नाही.",
    "જોખમ ચેતવણીઓ નિર્ણય-સહાયક સંકેતો છે. ગંભીર જોખમી ચિહ્નોમાં લાગુ આરોગ્ય પ્રોટોકોલ મુજબ તાત્કાલિક મૂલ્યાંકન જરૂરી છે. એપમાં ચેતવણી દેખાય એનો અર્થ એ નથી કે PHC ને રેફરલ મળી ગયો છે.",
    "ప్రమాద హెచ్చరికలు నిర్ణయానికి సహాయపడే సూచనలు మాత్రమే. తీవ్రమైన ప్రమాద సంకేతాలకు వర్తించే ఆరోగ్య ప్రోటోకాల్ ప్రకారం తక్షణ అంచనా అవసరం. యాప్‌లో హెచ్చరిక కనిపించడం అంటే PHCకి రెఫరల్ అందిందని కాదు.",
    "ಅಪಾಯ ಎಚ್ಚರಿಕೆಗಳು ನಿರ್ಧಾರ-ಬೆಂಬಲ ಸೂಚನೆಗಳು ಮಾತ್ರ. ಗಂಭೀರ ಅಪಾಯದ ಚಿಹ್ನೆಗಳಿಗೆ ಅನ್ವಯಿಸುವ ಆರೋಗ್ಯ ಪ್ರೋಟೋಕಾಲ್ ಪ್ರಕಾರ ತಕ್ಷಣದ ಮೌಲ್ಯಮಾಪನ ಅಗತ್ಯ. ಆ್ಯಪ್‌ನಲ್ಲಿ ಎಚ್ಚರಿಕೆ ಕಾಣುವುದರ ಅರ್ಥ PHC ಗೆ ರೆಫರಲ್ ತಲುಪಿದೆ ಎಂದಲ್ಲ.",
    "അപകട മുന്നറിയിപ്പുകൾ തീരുമാനത്തിന് സഹായിക്കുന്ന സൂചനകൾ മാത്രമാണ്. ഗുരുതരമായ അപകട ലക്ഷണങ്ങൾക്ക് ബാധകമായ ആരോഗ്യ പ്രോട്ടോക്കോൾ പ്രകാരം അടിയന്തര വിലയിരുത്തൽ ആവശ്യമാണ്. ആപ്പിൽ മുന്നറിയിപ്പ് കാണുന്നത് PHC-യ്ക്ക് റഫറൽ ലഭിച്ചു എന്നർത്ഥമില്ല."
  ]);
  A("Low", ["குறைவு","कम","कमी","ઓછું","తక్కువ","ಕಡಿಮೆ","കുറവ്"]);
  A("Reminder", ["நினைவூட்டல்","अनुस्मारक","स्मरणपत्र","રિમાઇન્ડર","గుర్తుచేత","ಜ್ಞಾಪನೆ","ഓർമ്മപ്പെടുത്തൽ"]);
  A("Moderate", ["மிதமான","मध्यम","मध्यम","મધ્યમ","మధ్యస్థ","ಮಧ್ಯಮ","മിതമായ"]);
  A("Attention", ["கவனம்","ध्यान दें","लक्ष द्या","ધ્યાન આપો","శ్రద్ధ","ಗಮನ","ശ്രദ്ധ"]);
  A("Critical", ["முக்கியமான","गंभीर","गंभीर","ગંભીર","తీవ్రమైన","ಗಂಭೀರ","ഗുരുതരം"]);
  A("Urgent", ["அவசரம்","तत्काल","तातडीचे","તાત્કાલિક","అత్యవసరం","ತುರ್ತು","അടിയന്തരം"]);
  A("Critical Patient Alert", ["முக்கிய நோயாளி எச்சரிக்கை","गंभीर रोगी अलर्ट","गंभीर रुग्ण सूचना","ગંભીર દર્દી ચેતવણી","తీవ్రమైన రోగి హెచ్చరిక","ಗಂಭೀರ ರೋಗಿ ಎಚ್ಚರಿಕೆ","ഗുരുതര രോഗി മുന്നറിയിപ്പ്"]);
  A("Patient", ["நோயாளி","रोगी","रुग्ण","દર્દી","రోగి","ರೋಗಿ","രോഗി"]);
  A("Beneficiary ID", ["பயனாளி எண்","लाभार्थी आईडी","लाभार्थी आयडी","લાભાર્થી ID","లబ్ధిదారు ఐడి","ಫಲಾನುಭವಿ ಐಡಿ","ഗുണഭോക്തൃ ഐഡി"]);
  A("Reported finding", ["தெரிவிக்கப்பட்ட கண்டறிதல்","रिपोर्ट किया गया निष्कर्ष","नोंदवलेले निष्कर्ष","નોંધાયેલ તારણ","నివేదించిన అంశం","ವರದಿ ಮಾಡಿದ ಸಂಶೋಧನೆ","റിപ്പോർട്ട് ചെയ്ത കണ്ടെത്തൽ"]);
  A("Location", ["இடம்","स्थान","ठिकाण","સ્થળ","స్థలం","ಸ್ಥಳ","സ്ഥലം"]);
  A("Unable to feed reported", ["உணவு உட்கொள்ள முடியவில்லை என தெரிவிக்கப்பட்டது","आहार न ले पाने की सूचना","आहार घेऊ न शकल्याची नोंद","ખોરાક ન લઈ શકવાની નોંધ","ఆహారం తీసుకోలేకపోతున్నట్లు నివేదించారు","ಆಹಾರ ಸೇವಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ ಎಂದು ವರದಿಯಾಗಿದೆ","ഭക്ഷണം കഴിക്കാൻ കഴിയുന്നില്ലെന്ന് റിപ്പോർട്ട് ചെയ്തു"]);
  A("Household visit", ["வீட்டு வருகை","घर पर मुलाकात","घरभेट","ઘરની મુલાકાત","ఇంటి సందర్శన","ಮನೆ ಭೇಟಿ","ഭവന സന്ദർശനം"]);
  A("Required action", ["தேவையான நடவடிக்கை","आवश्यक कार्रवाई","आवश्यक कृती","જરૂરી કાર્યવાહી","అవసరమైన చర్య","ಅಗತ್ಯ ಕ್ರಮ","ആവശ്യമായ നടപടി"]);
  A("Inform the patient and arrange urgent clinical assessment according to the PHC protocol.", ["நோயாளிக்குத் தெரிவித்து, PHC நெறிமுறைப்படி உடனடி மருத்துவ மதிப்பீட்டிற்கு ஏற்பாடு செய்யுங்கள்.","रोगी को सूचित करें और PHC प्रोटोकॉल के अनुसार तत्काल चिकित्सीय मूल्यांकन की व्यवस्था करें।","रुग्णाला कळवा आणि PHC प्रोटोकॉलनुसार तातडीच्या वैद्यकीय मूल्यांकनाची व्यवस्था करा.","દર્દીને જાણ કરો અને PHC પ્રોટોકોલ મુજબ તાત્કાલિક તબીબી મૂલ્યાંકનની વ્યવસ્થા કરો.","రోగికి తెలియజేసి, PHC ప్రోటోకాల్ ప్రకారం తక్షణ వైద్య పరీక్షకు ఏర్పాటు చేయండి.","ರೋಗಿಗೆ ತಿಳಿಸಿ ಮತ್ತು PHC ಪ್ರೋಟೋಕಾಲ್ ಪ್ರಕಾರ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ವ್ಯವಸ್ಥೆ ಮಾಡಿ.","രോഗിയെ അറിയിക്കുകയും PHC പ്രോട്ടോക്കോൾ പ്രകാരം അടിയന്തര വൈദ്യ വിലയിരുത്തലിന് ഏർപ്പാട് ചെയ്യുകയും ചെയ്യുക."]);
  A("Contact the PHC immediately.", ["உடனடியாக PHC-ஐத் தொடர்பு கொள்ளுங்கள்.","तुरंत PHC से संपर्क करें।","ताबडतोब PHC शी संपर्क साधा.","તરત જ PHC નો સંપર્ક કરો.","వెంటనే PHCని సంప్రదించండి.","ತಕ್ಷಣ PHC ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.","ഉടൻ PHC-യുമായി ബന്ധപ്പെടുക."]);
  A("Do not delay emergency care while waiting for digital acknowledgement.", ["டிஜிட்டல் ஒப்புதலுக்காகக் காத்திருந்து அவசர சிகிச்சையைத் தாமதப்படுத்த வேண்டாம்.","डिजिटल पावती की प्रतीक्षा में आपातकालीन देखभाल में देरी न करें।","डिजिटल पोचपावतीची वाट पाहत आपत्कालीन उपचारात विलंब करू नका.","ડિજિટલ સ્વીકૃતિની રાહ જોતા કટોકટીની સારવારમાં વિલંબ ન કરો.","డిజిటల్ ధృవీకరణ కోసం ఎదురుచూస్తూ అత్యవసర సంరక్షణను ఆలస్యం చేయవద్దు.","ಡಿಜಿಟಲ್ ಅಂಗೀಕಾರಕ್ಕಾಗಿ ಕಾಯುತ್ತಾ ತುರ್ತು ಆರೈಕೆಯನ್ನು ವಿಳಂಬ ಮಾಡಬೇಡಿ.","ഡിജിറ്റൽ അംഗീകാരത്തിനായി കാത്തിരുന്ന് അടിയന്തര പരിചരണം വൈകിപ്പിക്കരുത്."]);

  /* ---- PHC referrals ---- */
  A("PHC Referral Dashboard", ["PHC பரிந்துரை டாஷ்போர்டு","PHC रेफ़रल डैशबोर्ड","PHC संदर्भ डॅशबोर्ड","PHC રેફરલ ડેશબોર્ડ","PHC రెఫరల్ డాష్‌బోర్డ్","PHC ರೆಫರಲ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್","PHC റഫറൽ ഡാഷ്ബോർഡ്"]);
  A("No urgent referrals", ["அவசர பரிந்துரைகள் இல்லை","कोई तत्काल रेफ़रल नहीं","तातडीचे संदर्भ नाहीत","કોઈ તાત્કાલિક રેફરલ નથી","అత్యవసర రెఫరల్స్ లేవు","ತುರ್ತು ರೆಫರಲ್‌ಗಳಿಲ್ಲ","അടിയന്തര റഫറലുകളില്ല"]);
  A("Urgent referrals", ["அவசர பரிந்துரைகள்","तत्काल रेफ़रल","तातडीचे संदर्भ","તાત્કાલિક રેફરલ","అత్యవసర రెఫరల్స్","ತುರ್ತು ರೆಫರಲ್‌ಗಳು","അടിയന്തര റഫറലുകൾ"]);
  A("Awaiting review", ["மதிப்பாய்வுக்காக காத்திருப்பு","समीक्षा की प्रतीक्षा","पुनरावलोकनाच्या प्रतीक्षेत","સમીક્ષાની રાહ","సమీక్ష కోసం వేచి ఉంది","ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ","അവലോകനത്തിനായി കാത്തിരിക്കുന്നു"]);
  A("Incoming referral", ["வரும் பரிந்துரை","आने वाला रेफ़रल","येणारा संदर्भ","આવનાર રેફરલ","వచ్చే రెఫరల్","ಬರುವ ರೆಫರಲ್","വരുന്ന റഫറൽ"]);
  A("No referrals yet. When an ASHA worker marks a referral as initiated, it appears here with a sound alert.", ["இதுவரை பரிந்துரைகள் இல்லை. ASHA பணியாளர் ஒரு பரிந்துரையைத் தொடங்கியதாகக் குறித்தால், அது ஒலி எச்சரிக்கையுடன் இங்கே தோன்றும்.","अभी तक कोई रेफ़रल नहीं। जब कोई आशा कार्यकर्ता रेफ़रल को शुरू किया हुआ चिह्नित करेगी, तो वह ध्वनि अलर्ट के साथ यहाँ दिखेगा।","अद्याप कोणतेही संदर्भ नाहीत. आशा कार्यकर्तीने संदर्भ सुरू केल्याचे नोंदवल्यावर तो ध्वनी सूचनेसह येथे दिसेल.","હજુ સુધી કોઈ રેફરલ નથી. જ્યારે આશા કાર્યકર રેફરલ શરૂ કર્યાનું ચિહ્નિત કરશે, ત્યારે તે અવાજની ચેતવણી સાથે અહીં દેખાશે.","ఇంకా రెఫరల్స్ లేవు. ఆశా కార్యకర్త రెఫరల్‌ను ప్రారంభించినట్లు గుర్తిస్తే, అది శబ్ద హెచ్చరికతో ఇక్కడ కనిపిస్తుంది.","ಇನ್ನೂ ರೆಫರಲ್‌ಗಳಿಲ್ಲ. ಆಶಾ ಕಾರ್ಯಕರ್ತೆ ರೆಫರಲ್ ಪ್ರಾರಂಭಿಸಿದೆ ಎಂದು ಗುರುತಿಸಿದಾಗ, ಅದು ಶಬ್ದ ಎಚ್ಚರಿಕೆಯೊಂದಿಗೆ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.","ഇതുവരെ റഫറലുകളില്ല. ആശാ പ്രവർത്തക ഒരു റഫറൽ ആരംഭിച്ചതായി അടയാളപ്പെടുത്തുമ്പോൾ അത് ശബ്ദ മുന്നറിയിപ്പോടെ ഇവിടെ കാണിക്കും."]);

  /* ---------------------------------------------------------- translate core */
  var DECO = '[\\s\\u2192\\u2190\\u2197\\u203A\\u00BB\\u00AB\\u00B7:\\u2022|\\-\\u2013\\u2014]*';
  var DECO_RE = new RegExp('^(' + DECO + ')([\\s\\S]*?)(' + DECO + ')$');
  var SEP_RE = /(\s*\u00B7\s*)/;

  function exact(text, lang) {
    var e = DICT[norm(text)];
    return e && e[lang] ? e[lang] : null;
  }
  function pattern(text, lang) {
    var clean = text.replace(/[\u2018\u2019]/g, "'").replace(/\s+/g, ' ').trim();
    for (var i = 0; i < PATTERNS.length; i++) {
      var p = PATTERNS[i], m = p.re.exec(clean);
      if (!m || !p.entry[lang]) continue;
      var vals = {};
      p.names.forEach(function (n, j) { vals[n] = m[j + 1]; });
      return p.entry[lang].replace(/\{(\w+)\}/g, function (x, n) { return vals[n] != null ? vals[n] : x; });
    }
    return null;
  }
  function piece(text, lang) { return exact(text, lang) || pattern(text, lang); }

  // Returns translated string, or null when nothing matched.
  function translateString(text, lang) {
    if (lang === 'en') return null;
    var t = piece(text, lang);
    if (t) return lead(text) + t + trail(text);
    var m = DECO_RE.exec(text);
    if (!m || !m[2]) return null;
    var core = m[2];
    t = piece(core, lang);
    if (t) return m[1] + t + m[3];
    var parts = core.split(SEP_RE);              // "Low · Reminder", "5 overdue·6 active alerts"
    if (parts.length > 1) {
      var hit = false;
      parts = parts.map(function (p, i) {
        if (i % 2) return p;
        var r = piece(p, lang);
        if (r) hit = true;
        return r || p;
      });
      if (hit) return m[1] + parts.join('') + m[3];
    }
    return null;
  }
  function lead(s) { return /^\s*/.exec(s)[0]; }
  function trail(s) { return /\s*$/.exec(s)[0]; }

  /* -------------------------------------------------------------------- state */
  var current = 'en';
  var missingSet = {};
  var listeners = [];

  function effectiveLang() { return cfg.skipPage() ? 'en' : current; }
  function validCode(c) { return LANGUAGES.some(function (l) { return l.code === c; }); }
  function meta(c) { return LANGUAGES.filter(function (l) { return l.code === (c || current); })[0] || LANGUAGES[0]; }

  /* ------------------------------------------------------------- DOM engine */
  var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, SVG: 1, svg: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var textState = new WeakMap();   // Text node -> {src,out}
  var attrState = new WeakMap();   // Element   -> {attr:{src,out}}

  function blocked(el) {
    return !el || SKIP_TAGS[el.tagName] || cfg.skipElement(el);
  }

  function apply(src, lang) {
    if (lang === 'en') return src;
    var out = translateString(src, lang);
    if (out == null) {
      if (/[A-Za-z]{3,}/.test(src)) missingSet[src.trim()] = 1;
      return src;
    }
    return out;
  }

  function processText(node) {
    var p = node.parentNode;
    if (!p || p.nodeType !== 1 || blocked(p)) return;
    var cur = node.nodeValue, st = textState.get(node);
    var src = st && cur === st.out ? st.src : cur;     // changed by the app => new source
    if (!src || !src.trim()) return;
    var out = apply(src, effectiveLang());
    if (out !== cur) node.nodeValue = out;
    textState.set(node, { src: src, out: out });
  }

  function processAttrs(el) {
    if (blocked(el)) return;
    var names = ATTRS.slice();
    if (el.tagName === 'INPUT' && /^(button|submit|reset)$/i.test(el.type)) names.push('value');
    var map = attrState.get(el) || {};
    names.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var cur = el.getAttribute(a), st = map[a];
      var src = st && cur === st.out ? st.src : cur;
      if (!src || !src.trim()) return;
      var out = apply(src, effectiveLang());
      if (out !== cur) el.setAttribute(a, out);
      map[a] = { src: src, out: out };
    });
    attrState.set(el, map);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return processText(root);
    if (root.nodeType !== 1) return;
    if (blocked(root)) return;
    processAttrs(root);
    for (var c = root.firstChild; c; c = c.nextSibling) walk(c);
  }

  var queue = [], scheduled = false;
  function flush() {
    scheduled = false;
    var items = queue; queue = [];
    items.forEach(function (n) { if (n.isConnected !== false) walk(n); });
  }
  function enqueue(n) {
    queue.push(n);
    if (!scheduled) { scheduled = true; Promise.resolve().then(flush); }  // runs before paint
  }

  var observer = null;
  function startObserver() {
    if (observer || !global.MutationObserver) return;
    observer = new MutationObserver(function (records) {
      records.forEach(function (r) {
        if (r.type === 'childList') {
          for (var i = 0; i < r.addedNodes.length; i++) enqueue(r.addedNodes[i]);
        } else if (r.type === 'characterData') {
          enqueue(r.target);
        } else if (r.type === 'attributes') {
          enqueue(r.target);
        }
      });
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ATTRS.concat(['value'])
    });
  }

  function refresh() { if (document.body) walk(document.body); }

  /* --------------------------------------------------------------- public API */
  function t(en, params) {
    var lang = effectiveLang();
    var out = lang === 'en' ? null : (exact(en, lang) || pattern(en, lang));
    var s = out || en;
    if (params) s = s.replace(/\{(\w+)\}/g, function (x, k) { return params[k] != null ? params[k] : x; });
    return s;
  }

  function setLang(code) {
    if (!validCode(code)) code = 'en';
    current = code;
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
    document.documentElement.setAttribute('lang', code);
    missingSet = {};
    refresh();
    listeners.forEach(function (fn) { try { fn(code); } catch (e) {} });
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: code } }));
    return code;
  }

  function mountSwitcher(container) {
    var sel = document.createElement('select');
    sel.setAttribute('data-no-i18n', '');
    sel.setAttribute('aria-label', 'Language');
    LANGUAGES.forEach(function (l) {
      var o = document.createElement('option');
      o.value = l.code; o.textContent = l.native + (l.code === 'en' ? '' : ' (' + l.name + ')');
      sel.appendChild(o);
    });
    sel.value = current;
    sel.addEventListener('change', function () { setLang(sel.value); });
    onChange(function (c) { sel.value = c; });
    (container || document.body).appendChild(sel);
    return sel;
  }

  function onChange(fn) { listeners.push(fn); }

  function extend(map) {            // I18N.extend({ "English text": { hi: "...", ta: "..." } })
    Object.keys(map).forEach(function (en) { register(en, map[en]); });
    refresh();
  }

  function init() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    current = validCode(saved) ? saved : 'en';
    document.documentElement.setAttribute('lang', current);
    startObserver();
    refresh();
    // any element with data-set-lang="hi" switches language on click
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-set-lang]');
      if (el) setLang(el.getAttribute('data-set-lang'));
    });
    // SPA route changes (login <-> app)
    global.addEventListener('hashchange', refresh);
    global.addEventListener('popstate', refresh);
  }

  global.I18N = {
    t: t,
    setLang: setLang,
    getLang: function () { return current; },
    languages: LANGUAGES,
    speechLocale: function () { return meta().locale; },           // for Gnani STT/TTS, SpeechSynthesis
    formatDate: function (d, o) {
      return new Intl.DateTimeFormat(meta().locale, o || { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d || new Date());
    },
    formatNumber: function (n, o) { return new Intl.NumberFormat(meta().locale, o).format(n); },
    mountSwitcher: mountSwitcher,
    onChange: onChange,
    extend: extend,
    refresh: refresh,
    missing: function () { return Object.keys(missingSet); },       // strings still in English
    config: cfg
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window);
