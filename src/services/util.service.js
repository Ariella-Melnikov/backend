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
        priceRange: {
            min: null,
            max: null
        },
        propertyType: null,
        rooms: null,
        features: [],
        lastUpdated: new Date()
    };

    // Combine all messages for analysis
    const fullConversation = [
        ...messages.map(m => m.content),
        latestResponse
    ].join(" ");

    console.log("🔍 Analyzing Hebrew conversation:", fullConversation);

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

    for (const [hebrewCity, englishCity] of Object.entries(israeliCities)) {
        if (fullConversation.includes(hebrewCity)) {
            requirements.location = {
                hebrew: hebrewCity,
                english: englishCity
            };
            break;
        }
    }

    // 2. Price Range Matching
    // Match patterns like "4000 שקל" or "4000-5000 שקל" or "4000 עד 5000 שקל"
    const pricePattern = /(\d{3,9})(?:\s*-\s*|\s*עד\s*)(\d{3,9})?\s*(?:שקל|ש"ח|₪)/;
    const priceMatch = fullConversation.match(pricePattern);
    if (priceMatch) {
        requirements.priceRange.min = parseInt(priceMatch[1]);
        requirements.priceRange.max = priceMatch[2] ? parseInt(priceMatch[2]) : null;
    }

    // 3. Property Type Matching
    const propertyTypes = {
        "דירה": "apartment",
        "דירת גן": "garden_apartment",
        "פנטהאוז": "penthouse",
        "דופלקס": "duplex",
        "וילה": "villa",
        "קוטג": "cottage",
        "יחידת דיור": "studio",
        "דירת גג": "rooftop_apartment"
    };

    for (const [hebrewType, englishType] of Object.entries(propertyTypes)) {
        if (fullConversation.includes(hebrewType)) {
            requirements.propertyType = {
                hebrew: hebrewType,
                english: englishType
            };
            break;
        }
    }

    // 4. Room Count Matching
    // Match patterns like "3 חדרים" or "3.5 חדרים"
    const roomPattern = /(\d+(?:\.\d)?)\s*חדרים/;
    const roomMatch = fullConversation.match(roomPattern);
    if (roomMatch) {
        requirements.rooms = parseFloat(roomMatch[1]);
    }

    // 5. Features Matching
    const features = {
        "מרפסת": "balcony",
        "ממ״ד": "safe_room",
        "מעלית": "elevator",
        "חניה": "parking",
        "מחסן": "storage",
        "מיזוג": "ac",
        "אינטרקום": "intercom",
        "דלת פלדה": "steel_door",
        "מצלמות": "security_cameras",
        "שער חשמלי": "electric_gate",
        "לובי מפואר": "luxury_lobby",
        "בניין לשימור": "preserved_building",
        "תמא 38": "tama_38",
        "מועדון דיירים": "residents_club",
        "חדר כושר": "gym",
        "בריכה": "pool",
        "גג משותף": "shared_roof",
        "סוכה": "sukkah_balcony",
        "מטבח כפול": "double_kitchen",
        "יחידת הורים": "master_suite",
        "חדר ארונות": "walk_in_closet",
        "שירותי אורחים": "guest_bathroom",
        "מרפסת שמש": "sun_balcony",
        "מרפסת שירות": "service_balcony",
        "מטבח כשר": "kosher_kitchen",
        "מטבח משודרג": "upgraded_kitchen",
        "אי במטבח": "kitchen_island",
        "משופצת": "renovated",
        "משופצת מהיסוד": "fully_renovated",
        "במצב שמור": "well_maintained",
        "לשיפוץ": "needs_renovation",
        "גמר מפואר": "luxury_finish",
        "ריצוף יוקרתי": "luxury_flooring",
        "נוף לים": "sea_view",
        "נוף פתוח": "open_view",
        "נוף לפארק": "park_view",
        "שמש טובה": "good_sun",
        "אוויר טוב": "good_air",
        "שקט במיוחד": "very_quiet",
        "קרוב למרכז": "close_to_center",
        "קרוב לים": "close_to_beach",
        "קרוב לבתי כנסת": "close_to_synagogue",
        "קרוב לבתי ספר": "close_to_schools",
        "קרוב לתחבורה": "close_to_transport",
        "ריהוט": "furnished",
        "ריהוט חלקי": "partially_furnished",
        "מכשירי חשמל": "appliances_included",
        "חימום תת רצפתי": "floor_heating",
        "דלתות פנים": "interior_doors",
        "תריסים חשמליים": "electric_shutters",
        "רשתות": "window_screens",
        "גישה לנכים": "wheelchair_accessible",
        "דירת גן נגישה": "accessible_garden_apt",
        "מעלית שבת": "shabbat_elevator",
        "דוד שמש": "solar_heater",
        "דוד חשמל": "electric_heater",
        "גז מרכזי": "central_gas",
        "חימום מרכזי": "central_heating",
        "קומה גבוהה": "high_floor",
        "בניין חדש": "new_building",
        "גינה": "garden",
        "סורגים": "window_bars",
        "דוד שמש": "solar_heater",
    };

    for (const [hebrewFeature, englishFeature] of Object.entries(features)) {
        if (fullConversation.includes(hebrewFeature)) {
            requirements.features.push({
                hebrew: hebrewFeature,
                english: englishFeature
            });
        }
    }

    console.log("✅ Extracted requirements:", requirements);
    return requirements;
}

export function formatRequirementsForConfirmation(requirements) {
    const summary = {
        hebrew: '',
        english: ''
    };

    // Hebrew Summary
    let hebrewText = '📋 סיכום הדרישות שלך:\n\n';
    if (requirements.location) {
        hebrewText += `📍 מיקום: ${requirements.location.hebrew}\n`;
    }
    if (requirements.priceRange.min || requirements.priceRange.max) {
        hebrewText += '💰 תקציב: ';
        if (requirements.priceRange.min && requirements.priceRange.max) {
            hebrewText += `${requirements.priceRange.min.toLocaleString()} - ${requirements.priceRange.max.toLocaleString()} ₪\n`;
        } else if (requirements.priceRange.min) {
            hebrewText += `מ-${requirements.priceRange.min.toLocaleString()} ₪\n`;
        }
    }
    if (requirements.propertyType) {
        hebrewText += `🏡 סוג הנכס: ${requirements.propertyType.hebrew}\n`;
    }
    if (requirements.rooms) {
        hebrewText += `🛏️ חדרים: ${requirements.rooms}\n`;
    }
    if (requirements.features.length > 0) {
        hebrewText += '✨ מאפיינים: ' + requirements.features.map(f => f.hebrew).join(', ') + '\n';
    }
    hebrewText += '\nהאם אלו הפרטים הנכונים? אשמח לעדכן אם צריך שינויים.';

    // English Summary (for backend logging)
    let englishText = '📋 Requirements Summary:\n\n';
    if (requirements.location) {
        englishText += `📍 Location: ${requirements.location.english}\n`;
    }
    // ... similar for other fields

    return {
        hebrew: hebrewText,
        english: englishText
    };
}
