const functions = require('firebase-functions');
const {dialogflow, BasicCard, Image} = require('actions-on-google')
const fetch = require('isomorphic-fetch')
const xmldoc = require('xmldoc')
const app = dialogflow({debug: true})

const feedURL = 'https://www.heise.de/rss/heise-atom.xml'
const choices = 3
const limit = choices * 4
const feed = []
let start = 0

const outputFeed = (conv, myStart) => {
	myStart = myStart || start
	if (!feed.length)
		return conv.end('Ich habe leider keine Artikel gefunden.')
	if (feed.length < myStart)
		return conv.ask('Ich habe keine weiteren Artikel gefunden.')
	const responses = []
	for (let i = myStart; i < myStart + choices; i++) {
		if (i >= feed.length) {
			responses.push('Es sind keine weiteren Artikel vorhanden.')
			break
		}
		responses.push(`Artikel ${i + 1}: ${feed[i].valueWithPath('title')}`)
	}
	return conv.ask('<speak>' + responses.join('<break time="1"/>; ') + '</speak>')
}

app.intent('Default Welcome Intent', conv => {
	conv.ask(`<speak><s>Hier sind aktuelle Überschriften von Heise online. Sie können weiterblättern oder von einzelnen Artikeln die Zusammenfassung hören.</s><break time="1"/></speak>`)
	return fetch(feedURL)
		.then(resp => {
			if (resp.status < 200 || resp.status >= 400)
				throw new Error(resp.statusText)
			else
				return resp.text()
		})
		.then(body => {
			const xml = new xmldoc.XmlDocument(body)
			feed.push.apply(feed, xml.childrenNamed('entry').slice(0, limit))
			return outputFeed(conv)
		})
		.catch(err => {
			throw new Error(err)
		})
})

app.intent('repeat', conv => outputFeed(conv))

app.intent('nextItems', conv => {
	if (start + choices >= feed.length) {
		conv.ask('Es sind keine weiteren Artikel vorhanden.')
		return
	}
	start += choices
	outputFeed(conv)
})

app.intent('lastItems', conv => {
	if (start <= 0) {
		conv.ask('Es sind keine früheren Artikel vorhanden.')
		return
	}
	start -= Math.min(choices, start)
	outputFeed(conv)
})

app.intent('readItem', (conv, {number}) => {
	if (!number || number < 1 || number > feed.length) {
		conv.ask('Tut mir leid, das habe ich nicht verstanden.')
		return
	}
	number = Math.floor(number)
	if (conv.screen) {
		const html = feed[number - 1].valueWithPath('content')
		const imgUrl = /<img src="(.+?)"/.exec(html)[1]
		if (imgUrl) {
			const card = new BasicCard({
				title: feed[number - 1].valueWithPath('title'),
				image: new Image({
					url: imgUrl,
					alt: 'Vorschaubild'
				})
			})
			conv.ask(`Artikel ${number}`, card)
		}
	}
	conv.ask(`
	  <speak>
		<break time="1"/>
		Überschrift:
		${feed[number - 1].valueWithPath('title')}
		<break time="1"/>
		Zusammenfassung:
		${feed[number - 1].valueWithPath('summary')}
		</speak>
	`)
})

exports.heiseReader = functions.https.onRequest(app)
