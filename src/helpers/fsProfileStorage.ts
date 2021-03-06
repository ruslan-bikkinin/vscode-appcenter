import { ILogger } from '../log/logHelper';
import { FSUtils } from './fsUtils';
import { Profile, ProfileStorage } from './interfaces';

export default class FsProfileStorage<T extends Profile> implements ProfileStorage<T> {
    protected profiles: T[];
    protected indexOfActiveProfile: number | null;

    constructor(protected storageFilePath: string, protected logger: ILogger) {
        this.profiles = [];
    }

    public get activeProfile(): T | null {
        return (this.indexOfActiveProfile === null || this.profiles.length <= this.indexOfActiveProfile) ? null : this.profiles[this.indexOfActiveProfile];
    }

    public async init(): Promise<void> {
        if (!await this.storageExists()) {
            await this.createEmptyStorage();
        }
        await this.loadDataFromStorage();
    }

    private async createEmptyStorage(): Promise<void> {
        return await FSUtils.writeFile(this.storageFilePath, "[]");
    }

    private async storageExists(): Promise<boolean> {
        return await FSUtils.exists(this.storageFilePath);
    }

    private async loadDataFromStorage(): Promise<void> {
        try {
            const data: string = await FSUtils.readFile(this.storageFilePath);
            this.profiles = JSON.parse(data);
        } catch (e) {
            this.logger.info(`Failed to parse JSON file for ${this.storageFilePath}. ` + (e && e.message) || "");
            return;
        }

        // Identify active profile
        const activeProfiles: T[] = this.profiles.filter(profile => profile.isActive);

        if (activeProfiles.length > 1) {
            throw new Error(`Malformed profile data. Shouldn\'t be more than one active profile. Try deleting ${this.storageFilePath} and log in again.`);
        } else if (activeProfiles.length === 1) {
            this.indexOfActiveProfile = this.profiles.indexOf(activeProfiles[0]);
        }
    }

    private async saveProfiles(): Promise<void> {
        const data = JSON.stringify(this.profiles, null, "\t");
        try {
            await FSUtils.writeFile(this.storageFilePath, data);
        } catch (e) {
            this.logger.info(`Failed to write profiles into ${this.storageFilePath}. ` + (e && e.message) || "");
            return;
        }
    }

    public async save(profile: T): Promise<void> {
        const deletedProfile = await this.delete(profile.userId);

        // If user just re-logged in then preserve active state
        if (deletedProfile && deletedProfile.userId === profile.userId) {
            profile.isActive = deletedProfile.isActive;
        }

        if (this.activeProfile) {
            this.activeProfile.isActive = false;
            this.indexOfActiveProfile = null;
        }

        // Add new user
        const createdIndex = this.profiles.push(profile) - 1;
        if (profile.isActive) {
            this.indexOfActiveProfile = createdIndex;
        }
        await this.saveProfiles();
    }

    public async delete(userId: string): Promise<T | null> {
        const foundProfile = await this.get(userId);
        if (!foundProfile) {
            return null;
        }
        const indexToDelete = this.profiles.indexOf(foundProfile);
        const deletedProfile: T[] = this.profiles.splice(indexToDelete, 1);
        if (this.indexOfActiveProfile) {
            if (indexToDelete < this.indexOfActiveProfile) {
                this.indexOfActiveProfile--;
            } else if (indexToDelete === this.indexOfActiveProfile) {
                this.indexOfActiveProfile = null;
            }
        }
        await this.saveProfiles();
        return deletedProfile[0];
    }

    public async get(userId: string): Promise<T | null> {
        const foundProfiles: T[] = this.profiles.filter(value => value.userId === userId);
        if (foundProfiles.length === 1) {
            return foundProfiles[0];
        } else if (foundProfiles.length > 1) {
            throw new Error(`There are more than one profile saved with userId ${userId}. Try deleting ${this.storageFilePath} and log in again.`);
        }
        return null;
    }

    public async list(): Promise<T[]> {
        return this.profiles;
    }
}
