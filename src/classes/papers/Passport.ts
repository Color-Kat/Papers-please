import { Papers } from "./Papers";
import { IPassport } from "./IPapers/IPassport";
import { IPersonPassport } from "./IPapers/IPersonPassport";
export class Passport extends Papers {
	public type: string = 'Passport';
	constructor (
		fullName: string,
		passportID: string,
		public country: string,
		public city: string,
		public gender: string,
		public expired: string,
		public brithday: string,
		public image: string
	) {
		super(fullName, passportID);
	}
}
