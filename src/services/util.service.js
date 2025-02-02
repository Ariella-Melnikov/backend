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
    const requirements = {
        location: null,
        minPrice: null,
        maxPrice: null,
        bedrooms: null,
        bathrooms: null,
        propertyType: null,
        features: [],
        area: null,
        floor: null,
        lastUpdated: new Date()
    };

    const fullConversation = [
        ...messages.map(m => m.content),
        latestResponse
    ].join(' ');

    const locationMatch = fullConversation.match(/(?:in|at|near)\s+([A-Za-z\s,]+?)(?:\s+with|\s+for|\s+that|\.|$)/i);
    if (locationMatch) requirements.location = locationMatch[1].trim();

    const priceMatch = fullConversation.match(/(\d+(?:,\d{3})*)\s*(?:to|\-)\s*(\d+(?:,\d{3})*)/);
    if (priceMatch) {
        requirements.minPrice = parseInt(priceMatch[1].replace(/,/g, ''));
        requirements.maxPrice = parseInt(priceMatch[2].replace(/,/g, ''));
    }

    const bedroomMatch = fullConversation.match(/(\d+)\s*(?:bedroom|bed|br)/i);
    if (bedroomMatch) requirements.bedrooms = parseInt(bedroomMatch[1]);

    const propertyTypes = ['apartment', 'house', 'condo', 'studio', 'penthouse'];
    for (const type of propertyTypes) {
        if (fullConversation.toLowerCase().includes(type)) {
            requirements.propertyType = type;
            break;
        }
    }

    const features = ['parking', 'balcony', 'elevator', 'storage', 'air conditioning'];
    requirements.features = features.filter(feature =>
        fullConversation.toLowerCase().includes(feature)
    );

    return requirements;
}