namespace GearsAPI.Settings.World
{
    public interface IWorldModSetting : IModSetting
    {
        IWorldModSettingsCategory Category { get; }

    }

}
