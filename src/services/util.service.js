import fs from 'fs'
import fr from 'follow-redirects'

const {http, https} = fr


export function makeId(length = 5) {
	var txt = ''
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	for (let i = 0; i < length; i++) {
		txt += possible.charAt(Math.floor(Math.random() * possible.length))
	}
	return txt
}

export function debounce(func, timeout = 300) {
	let timer
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

export function getRandomInt(min, max) {
	min = Math.ceil(min)
	max = Math.floor(max)
	return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRandomName() {
	const names = ['Jhon', 'Wick', 'Strong', 'Dude', 'Yep', 'Hello', 'World', 'Power', 'Goku', 'Super', 'Hi', 'You', 'Are', 'Awesome']
	const famName = ['star', 'kamikaza', 'family', 'eat', 'some', 'banana', 'brock', 'david', 'gun', 'walk', 'talk', 'car', 'wing', 'yang', 'snow', 'fire']
	return names[Math.floor(Math.random() * names.length)] + famName[Math.floor(Math.random() * names.length)]
}

export function generateRandomImg() {
	//try to get diff img every time
	return 'pro' + Math.floor(Math.random() * 17 + 1) + '.png'
}

export function timeAgo(ms = new Date()) {
	const date = ms instanceof Date ? ms : new Date(ms)
	const formatter = new Intl.RelativeTimeFormat('en')
	const ranges = {
		years: 3600 * 24 * 365,
		months: 3600 * 24 * 30,
		weeks: 3600 * 24 * 7,
		days: 3600 * 24,
		hours: 3600,
		minutes: 60,
		seconds: 1,
	}
	const secondsElapsed = (date.getTime() - Date.now()) / 1000
	for (let key in ranges) {
		if (ranges[key] < Math.abs(secondsElapsed)) {
			const delta = secondsElapsed / ranges[key]
			let time = formatter.format(Math.round(delta), key)
			if (time.includes('in')) {
				time = time.replace('in ', '')
				time = time.replace('ago', '')
				time += ' ago'
			}
			return time //? time : 'Just now'
		}
	}
}

export function randomPastTime() {
	const HOUR = 1000 * 60 * 60
	const DAY = 1000 * 60 * 60 * 24
	const WEEK = 1000 * 60 * 60 * 24 * 7

	const pastTime = getRandomIntInclusive(HOUR, WEEK)
	return Date.now() - pastTime
}

export function readJsonFile(path) {
	const str = fs.readFileSync(path, 'utf8')
	console.log('File path:', path);
	const json = JSON.parse(str)
	return json
  }

 export function httpGet(url) {
	const protocol = url.startsWith('https') ? https : http
	const options = {
	  method: 'GET'
	}
  
	return new Promise((resolve, reject) => {
	  const req = protocol.request(url, options, (res) => {
		let data = ''
		res.on('data', (chunk) => {
		  data += chunk
		})
		res.on('end', () => {
		  resolve(data)
		})
	  })
	  req.on('error', (err) => {
		reject(err)
	  })
	  req.end()
	})
  
  }

export function extractPropertyRequirements(messages, latestResponse) {
    // Initialize requirements object
    const requirements = {
        location: null,
        priceRange: { max: null, currency: "₪" },
        propertyType: null,
        rooms: null,
        features: [],
        lastUpdated: new Date()
    };

    // Features mapping
    const featureMap = {
      'מרפסת': 'balcony',
      'ממ"ד': 'safe room',
      'מעלית': 'elevator',
      'חניה': 'parking',
      'מיזוג': 'AC',
      'מחסן': 'storage',
      'גינה': 'garden',
      'משופצת': 'renovated'
    };

    // 1. Location Matching (Israeli Cities)
    const israeliCities = {
        "תל אביב": "Tel Aviv",
        "ירושלים": "Jerusalem",
        "חיפה": "Haifa",
        "רמת גן": "Ramat Gan",
        "גבעתיים": "Givatayim",
        "הרצליה": "Herzliya",
        "רעננה": "Raanana",
        // Central Israel
        "פתח תקווה": "Petah Tikva",
        "ראשון לציון": "Rishon LeZion",
        "נתניה": "Netanya",
        "חולון": "Holon",
        "בת ים": "Bat Yam",
        "רחובות": "Rehovot",
        "כפר סבא": "Kfar Saba",
        "הוד השרון": "Hod HaSharon",
        "יהוד": "Yehud",
        "אור יהודה": "Or Yehuda",
        "רמת השרון": "Ramat HaSharon",
        
        // Jerusalem Area
        "מבשרת ציון": "Mevaseret Zion",
        "מעלה אדומים": "Maale Adumim",
        "ביתר עילית": "Beitar Illit",
        "מודיעין": "Modiin",
        "בית שמש": "Beit Shemesh",
        
        // North
        "עכו": "Akko",
        "כרמיאל": "Karmiel",
        "נהריה": "Nahariya",
        "צפת": "Tzfat",
        "טבריה": "Tiberias",
        "עפולה": "Afula",
        "קריית שמונה": "Kiryat Shmona",
        
        // Haifa Area
        "קריית ביאליק": "Kiryat Bialik",
        "קריית מוצקין": "Kiryat Motzkin",
        "קריית ים": "Kiryat Yam",
        "קריית אתא": "Kiryat Ata",
        "טירת כרמל": "Tirat Carmel",
        
        // South
        "באר שבע": "Beer Sheva",
        "אשדוד": "Ashdod",
        "אשקלון": "Ashkelon",
        "דימונה": "Dimona",
        "אילת": "Eilat",
        "קריית גת": "Kiryat Gat",
        
        // Sharon Area
        "זכרון יעקב": "Zichron Yaakov",
        "בנימינה": "Binyamina",
        "פרדס חנה": "Pardes Hana",
        "חדרה": "Hadera",
        
        // Tel Aviv Neighborhoods
        "רמת אביב": "Ramat Aviv",
        "פלורנטין": "Florentin",
        "צהלה": "Tzahala",
        "נווה צדק": "Neve Tzedek",
        "הצפון הישן": "Old North",
        "הצפון החדש": "New North",
        "יפו": "Jaffa",
        "רמת החייל": "Ramat HaChayal",
        
        // Common Areas
        "מרכז": "Center",
        "צפון": "North",
        "דרום": "South",
        "השרון": "HaSharon",
        "גוש דן": "Gush Dan",
        "המושבות": "HaMoshavot"
    };

     // 🔹 Combine all chat messages + latest response into a single string
     const fullConversation = [...messages.map(m => m.content), latestResponse].join(" ");
 
     // 🔹 Location Extraction
     for (const [hebrewCity, englishCity] of Object.entries(israeliCities)) {
         if (fullConversation.includes(hebrewCity)) {
             requirements.location = { hebrew: hebrewCity, english: englishCity };
             break;
         }
     }
 
     // 🔹 Price Extraction (Handles both "עד 5000 שקל" and "4000-5000 שקל")
     const pricePattern = /(\d{3,9})(?:\s*-\s*|\s*עד\s*(\d{3,9}))?\s*(?:שקל|ש"ח|₪)?/;
     const priceMatch = fullConversation.match(pricePattern);
     if (priceMatch) {
         requirements.priceRange.max = priceMatch[2] ? parseInt(priceMatch[2]) : parseInt(priceMatch[1]);
     }
 
     // 🔹 Property Type Extraction
     const propertyTypes = {
         "דירה": "Apartment",
         "בית פרטי": "Private House",
         "דו משפחתי": "Duplex",
         "וילה": "Villa",
         "סטודיו": "Studio",
         "פנטהאוז": "Penthouse"
     };
 
     for (const [hebrewType, englishType] of Object.entries(propertyTypes)) {
         if (fullConversation.includes(hebrewType)) {
             requirements.propertyType = { hebrew: hebrewType, english: englishType };
             break;
         }
     }
 
     // 🔹 Room Extraction
     const roomsPattern = /(\d{1,2})\s*חדרים?/;
     const roomsMatch = fullConversation.match(roomsPattern);
     if (roomsMatch) {
         requirements.rooms = parseInt(roomsMatch[1]);
     }
 
     // Extract features
     Object.entries(featureMap).forEach(([hebrew, english]) => {
       if (latestResponse.toLowerCase().includes(hebrew.toLowerCase())) {
         requirements.features.push({
           hebrew: hebrew,
           english: english
         });
       }
     });

    return requirements;
 }

