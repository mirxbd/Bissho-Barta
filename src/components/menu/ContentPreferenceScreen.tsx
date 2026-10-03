import { ArrowLeft } from 'lucide-react';
import { VideoResolutionSetting } from '../../utils/mediaOptimizer';
import { FeedPreferenceMode } from '../../utils/contentPreference';
import SegmentedControl from './SegmentedControl';
import SettingsGroup from './SettingsGroup';
import SettingsRow from './SettingsRow';
import Toggle from './Toggle';

interface ContentPreferenceScreenProps {
  feedPreference: FeedPreferenceMode;
  onChangeFeedPreference: (pref: FeedPreferenceMode) => void;
  videoResolution: VideoResolutionSetting;
  onChangeVideoResolution: (res: VideoResolutionSetting) => void;
  reducedSensitive: boolean;
  onToggleReducedSensitive: (next: boolean) => void;
  autoplayVideos: boolean;
  onToggleAutoplayVideos: (next: boolean) => void;
  dataSaver: boolean;
  onToggleDataSaver: (next: boolean) => void;
  darkModeActive: boolean;
  onToggleDarkMode: (next: boolean) => void;
  onBack: () => void;
}

export default function ContentPreferenceScreen({
  feedPreference,
  onChangeFeedPreference,
  videoResolution,
  onChangeVideoResolution,
  reducedSensitive,
  onToggleReducedSensitive,
  autoplayVideos,
  onToggleAutoplayVideos,
  dataSaver,
  onToggleDataSaver,
  darkModeActive,
  onToggleDarkMode,
  onBack,
}: ContentPreferenceScreenProps) {
  return (
    <div className="p-4 space-y-6">
      {/* Feed Mode Switch */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-3">
        <div>
          <div className="text-[15px] font-medium text-[#111827]">
            Feed Mode
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            For You shows today's viral trends (last 3 days). Following shows latest chronological posts from followed pages and friends.
          </p>
        </div>
        <SegmentedControl<FeedPreferenceMode>
          ariaLabel="Feed Mode"
          value={feedPreference}
          onChange={onChangeFeedPreference}
          options={[
            { value: 'For you', label: 'For You' },
            { value: 'Following', label: 'Following' },
          ]}
        />
      </div>

      {/* Default Video Quality */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-3">
        <div>
          <div className="text-[15px] font-medium text-[#111827]">
            Video Quality
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Select default resolution for video playback and uploads
          </p>
        </div>
        <SegmentedControl<VideoResolutionSetting>
          ariaLabel="Video Quality"
          value={videoResolution}
          onChange={onChangeVideoResolution}
          options={[
            { value: '480p', label: '480p' },
            { value: '720p', label: '720p' },
          ]}
        />
      </div>

      {/* Flat list of rows with label, one-line description, and toggle on the right */}
      <SettingsGroup title="Feed & Media Controls">
        <SettingsRow
          label="Reduce Sensitive Content"
          description="Filter out potentially sensitive posts from your timeline"
          rightElement={
            <Toggle
              id="reduce-sensitive-toggle-btn"
              checked={reducedSensitive}
              onChange={onToggleReducedSensitive}
              ariaLabel="Reduce Sensitive Content"
            />
          }
        />
        <SettingsRow
          label="Autoplay Videos"
          description="Play videos automatically while scrolling through feeds"
          rightElement={
            <Toggle
              id="autoplay-videos-toggle-btn"
              checked={autoplayVideos}
              onChange={onToggleAutoplayVideos}
              ariaLabel="Autoplay Videos"
            />
          }
        />
        <SettingsRow
          label="Data Saver"
          description="Reduce media quality to save mobile data"
          rightElement={
            <Toggle
              id="data-save-toggle-btn"
              checked={dataSaver}
              onChange={onToggleDataSaver}
              ariaLabel="Data Saver"
            />
          }
        />
        <SettingsRow
          label="Night Mode"
          description="Use dark surfaces and light text across the app"
          rightElement={
            <Toggle
              id="night-mode-toggle-btn"
              checked={darkModeActive}
              onChange={onToggleDarkMode}
              ariaLabel="Night Mode"
            />
          }
        />
      </SettingsGroup>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to Menu"
        className="w-full h-11 bg-white border border-[#076653] text-[#076653] hover:bg-[#EBF7F2] font-semibold text-sm rounded-[10px] flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] focus-visible:ring-offset-2"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        <span>Back to Menu</span>
      </button>
    </div>
  );
}
