import { Papers } from "./Papers";
import { IPersonalCard } from "./IPapers/IPersonalCard";
export class PersonalCard extends Papers {
	public type: string = 'Personal card';
	/*свойства личной карты */
	constructor (
		fullName: string,
		passportID: string,
		public brithday: string,
		public districkt: string,
		public country: string,
		public weight: number,
		public height: number,
		public image: string
	) {
		super(fullName, passportID);
	}
}
