export class VersionNumber {
    private constructor(readonly value: number) {}

    static first(): VersionNumber {
        return new VersionNumber(1);
    }

    static next(currentHighestVersion: number): VersionNumber {
        return new VersionNumber(Math.max(0, currentHighestVersion) + 1);
    }
}
