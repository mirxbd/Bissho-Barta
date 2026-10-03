import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Post, UserProfile } from '../../types';
import SegmentedControl from './SegmentedControl';
import SettingsGroup from './SettingsGroup';
import SettingsRow from './SettingsRow';

interface ToolsScreenProps {
  profile: UserProfile;
  posts: Post[];
  onShowToast?: (msg: string) => void;
  onBack: () => void;
}

type ToolsTabId = 'dashboard' | 'analytics' | 'monetization';

export default function ToolsScreen({
  profile,
  posts,
  onShowToast,
  onBack,
}: ToolsScreenProps) {
  const [toolsTab, setToolsTab] = useState<ToolsTabId>('dashboard');

  const myUserId = profile.id || 'user_me';
  const myPosts = posts.filter(
    (p) =>
      (p.authorId ? p.authorId === myUserId : p.authorName === profile.name) &&
      !p.isScheduled
  );
  const scheduledPostsCount = posts.filter(
    (p) =>
      (p.authorId ? p.authorId === myUserId : p.authorName === profile.name) &&
      p.isScheduled
  ).length;
  const totalLikesReceived = myPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalCommentsReceived = myPosts.reduce(
    (sum, p) => sum + (p.comments?.length || 0),
    0
  );
  const totalSharesReceived = myPosts.reduce(
    (sum, p) => sum + (p.shares || 0),
    0
  );
  const totalInteractions =
    totalLikesReceived + totalCommentsReceived + totalSharesReceived;
  const followersTotal = profile.followersCount || 1250;
  const followingTotal = profile.followingCount || 184;
  const engagementRate =
    myPosts.length > 0
      ? Math.min(
          100,
          Number(
            (
              (totalInteractions /
                Math.max(1, myPosts.length * Math.max(10, followersTotal * 0.1))) *
              100
            ).toFixed(1)
          )
        )
      : 0;

  return (
    <div className="p-4 space-y-6">
      <SegmentedControl<ToolsTabId>
        ariaLabel="Creator tools sections"
        value={toolsTab}
        onChange={setToolsTab}
        options={[
          { value: 'dashboard', label: 'Dashboard', id: 'tools-subtab-dashboard' },
          { value: 'analytics', label: 'Analytics', id: 'tools-subtab-analytics' },
          { value: 'monetization', label: 'Monetization', id: 'tools-subtab-monetization' },
        ]}
      />

      {toolsTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Overview Section */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#111827] px-1">
              Overview
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  {totalInteractions.toLocaleString()}
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Total Interactions
                </div>
              </div>
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  {engagementRate}%
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Engagement Rate
                </div>
              </div>
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  {myPosts.length.toLocaleString()}
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Published Posts
                </div>
              </div>
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  {totalLikesReceived.toLocaleString()}
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Total Likes
                </div>
              </div>
            </div>
          </section>

          {/* Growth Section */}
          <SettingsGroup title="Growth">
            <SettingsRow
              label="Followers"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {followersTotal.toLocaleString()}
                </span>
              }
            />
            <SettingsRow
              label="Following"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {followingTotal.toLocaleString()}
                </span>
              }
            />
            <SettingsRow
              label="Comments & Replies"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {totalCommentsReceived.toLocaleString()}
                </span>
              }
            />
            <SettingsRow
              label="Post Shares"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {totalSharesReceived.toLocaleString()}
                </span>
              }
            />
            <SettingsRow
              label="Scheduled Posts"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {scheduledPostsCount}
                </span>
              }
            />
          </SettingsGroup>

          {/* Activity Section */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#111827] px-1">
              Activity
            </h3>
            {myPosts.length === 0 ? (
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 text-center">
                <p className="text-sm text-[#6B7280]">
                  No published posts yet. Share a post to see your activity here.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] divide-y divide-[#E5E7EB] overflow-hidden">
                {myPosts.slice(0, 5).map((post) => (
                  <div key={post.id} className="px-4 py-3 space-y-1">
                    <div className="text-sm font-medium text-[#111827] truncate">
                      {post.content || 'Media post'}
                    </div>
                    <div className="text-xs text-[#6B7280]">
                      {post.likes} likes · {post.comments?.length || 0} comments · {post.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {toolsTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Section */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#111827] px-1">
              Performance
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  {myPosts.length > 0
                    ? (totalLikesReceived / myPosts.length).toFixed(1)
                    : '0'}
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Avg. Likes per Post
                </div>
              </div>
              <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  {myPosts.length > 0
                    ? (totalCommentsReceived / myPosts.length).toFixed(1)
                    : '0'}
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Avg. Comments per Post
                </div>
              </div>
            </div>
          </section>

          {/* Audience Section */}
          <SettingsGroup title="Audience">
            <SettingsRow
              label="Primary Location"
              rightElement={
                <span className="text-sm font-medium text-[#111827]">
                  {profile.location || 'Dhaka, Bangladesh'}
                </span>
              }
            />
            <SettingsRow
              label="Total Followers"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {followersTotal.toLocaleString()}
                </span>
              }
            />
          </SettingsGroup>

          {/* Content Section */}
          <SettingsGroup title="Content Breakdown">
            <SettingsRow
              label="Published Posts"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {myPosts.length}
                </span>
              }
            />
            <SettingsRow
              label="Total Shares"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {totalSharesReceived}
                </span>
              }
            />
            <SettingsRow
              label="Total Comments"
              rightElement={
                <span className="text-sm font-semibold text-[#111827] tabular-nums">
                  {totalCommentsReceived}
                </span>
              }
            />
          </SettingsGroup>
        </div>
      )}

      {toolsTab === 'monetization' && (
        <div className="space-y-6">
          {/* Balance Section */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#111827] px-1">
              Balance
            </h3>
            <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 space-y-4">
              <div>
                <div className="text-2xl font-semibold text-[#111827] tabular-nums">
                  ৳0.00
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  Available Balance (Demo)
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onShowToast?.(
                    'Demo: Payout requests are simulated in demo mode.'
                  )
                }
                className="w-full h-11 bg-white border border-[#076653] text-[#076653] hover:bg-[#EBF7F2] font-semibold text-sm rounded-[10px] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#076653] focus-visible:ring-offset-2"
              >
                Request Payout (Demo)
              </button>
            </div>
          </section>

          {/* Payouts Section */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#111827] px-1">
              Payouts
            </h3>
            <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
              <p className="text-sm text-[#6B7280]">
                No payout history yet. Connect a payout account to receive creator earnings.
              </p>
            </div>
          </section>

          {/* Stars & Tips Section */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-[#111827] px-1">
              Stars & Tips
            </h3>
            <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4">
              <p className="text-sm text-[#6B7280]">
                Stars and fan gifting are shown as a demo preview. Earnings will appear here once enabled.
              </p>
            </div>
          </section>
        </div>
      )}

      {/* Back Button on every Tools / Dashboard function */}
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
