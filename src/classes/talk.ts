import { EntryPermit } from "./papers/EntryPermit";
import { PersonalCard } from "./papers/PersonalCard";
import { Passport } from "./papers/Passport";
let faker = require("faker");

export class Talk {
	//документы гражданина
	public passport: Passport; // паспорт
	public pCard: PersonalCard; // личная карта
	public entryPermit: EntryPermit; // разрешенье на въезд

	// Сценарий разговора с гражданином
	protected dialog: { [key: string]: string | Function } = {
		"Papers, please": () => {
			console.log(this.passport);
			console.log(this.pCard);
			console.log(this.entryPermit);
		}
	};

	// Цель поездки -> срок -> ответ на вопрос
	protected durationAnswers: { [key: string]: { [key: string]: string } } = {
		TRANSIT: {
			"14 DAYS": faker.random.arrayElement([
				"think a couple of weeks",
				"I think a couple of weeks. Not more",
				"Two weeks"
			]),
			"2 DAYS": faker.random.arrayElement([
				"a few days",
				"I'm here for two days",
				"Two days"
			])
		},
		VISIT: {
			"3 MONTH": faker.random.arrayElement([
				"I think three months",
				"I will be there for three months",
				"Three months"
			]),
			"1 MONTH": faker.random.arrayElement([
				"I think month",
				"I will be there for month",
				"One months"
			]),
			"14 DAYS": faker.random.arrayElement([
				"think a couple of weeks",
				"I think a couple of weeks. Not more",
				"Two weeks"
			])
		},
		WORK: {
			"2 WEEKS": faker.random.arrayElement([
				"I will be there two weeks",
				"I was taken for for a couple of weeks",
				"Two weeks"
			]),
			"6 MONTH": faker.random.arrayElement([
				"I'm going for six months",
				"I was taken for six months",
				"Six months"
			]),
			"1 YEAR": faker.random.arrayElement([
				"I am going for a year",
				"I was taken for a year",
				"One year"
			])
		},
		IMMIGRATION: {
			Forever: faker.random.arrayElement([ "I will live there", "Permanent residence" ])
		}
	};

	// Цель поездки -> ответ на вопрос
	protected purposeAnswers: { [key: string]: string } = {
		TRANSIT: faker.random.arrayElement([
			"I'm here in transit, going to another place",
			"I'm here in transit, I'm going to another country",
			"I'm here in transit",
			"Transit",
			"I'm passing through here"
		]),
		VISIT: faker.random.arrayElement([
			"I'm going to my brother",
			"I want to visit my parents",
			"I'm going to my sister",
			"I'm going to my mother",
			"I'm going to my father",
			"I'm going to my parents",
			"To visit friends",
			"Invited to visit",
			"To visit",
			"Visit"
		]),
		WORK: faker.random.arrayElement([
			"I was given a job here",
			"I'm going to work here",
			"I found a job here",
			"I will work here",
			"I'm here for work",
			"I got a job",
			"Work"
		])
	};
	public *talkDialog () {
		for (let quetion in this.dialog) {
			if (typeof this.dialog[quetion] == "string") {
				// console.log(quetion + "? -- " + this.dialog[quetion]);
				yield quetion + "? -- " + this.dialog[quetion];
			} else if (typeof this.dialog[quetion] == "function") {
				// console.log(quetion + "? -- " + (this.dialog[quetion] as Function)());
				yield quetion + "? -- ";
			}
		}
		// return false;
	}
}
