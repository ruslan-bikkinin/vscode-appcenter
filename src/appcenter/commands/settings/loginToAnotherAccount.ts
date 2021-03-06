import { CommandParams } from "../../../helpers/interfaces";
import { Command } from "../command";
import Login from "../login";

export default class LoginToAnotherAccount extends Command {
    public async run(): Promise<boolean | void> {
        if (!await super.run()) {
            return false;
        }
        const params: CommandParams = {
            manager: this.manager,
            logger: this.logger,
            appCenterAuth: this.appCenterAuth,
            vstsAuth: this.vstsAuth
        };
        return await new Login(params).runNoClient();
    }
}
