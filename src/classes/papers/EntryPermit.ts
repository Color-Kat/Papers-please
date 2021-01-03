import { Papers } from "./Papers";
import { IEntryPermit } from "./IPapers/IEntryPermit";
export class EntryPermit extends Papers implements IEntryPermit {
	public type: string = 'Entry permit';
	/*свойства разрешения на въезд */
	constructor (
		fullName: string,
		passportID: string,
		public purpose: string,
		public duration: string,
		public enterBy: string
	) {
		super(fullName, passportID);
	}
}
