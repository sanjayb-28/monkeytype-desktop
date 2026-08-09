import {
  RankAndCount,
  UserProfile as UserProfileType,
} from "@monkeytype/schemas/users";
import { JSXElement, Show } from "solid-js";

import { getFormatting } from "../../../states/core";
import { formatTopPercentage } from "../../../utils/misc";
import { ActivityCalendar } from "./ActivityCalendar";
import { PbCard } from "./PbCard";
import { UserDetails } from "./UserDetails";

export function UserProfile(props: {
  profile: UserProfileType;
  isAccountPage?: true;
  accountActions?: JSXElement;
  hideLeaderboards?: boolean;
}): JSXElement {
  return (
    <div class="grid w-full gap-8">
      <UserDetails
        profile={props.profile}
        isAccountPage={props.isAccountPage}
        accountActions={props.accountActions}
      />
      <Show
        when={
          !props.hideLeaderboards &&
          !props.profile.banned &&
          !props.profile.lbOptOut
        }
      >
        <LeaderboardPosition
          top15={props.profile.allTimeLbs?.time?.["15"]?.["english"]}
          top60={props.profile.allTimeLbs?.time?.["60"]?.["english"]}
        />
      </Show>
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <PbCard
          mode="time"
          mode2={["15", "30", "60", "120"]}
          pbs={props.profile.personalBests.time}
          isAccountPage={props.isAccountPage}
        />
        <PbCard
          mode="words"
          mode2={["10", "25", "50", "100"]}
          pbs={props.profile.personalBests.words}
          isAccountPage={props.isAccountPage}
        />
      </div>
      <Show when={!props.hideLeaderboards && props.profile.lbOptOut}>
        <span class="text-center text-xs text-sub">
          Note: This account has opted out of the leaderboards, meaning their
          results aren&apos;t verified by the anticheat system and may not be
          legitimate.
        </span>
      </Show>

      <ActivityCalendar
        testActivity={
          props.isAccountPage ? undefined : props.profile.testActivity
        }
        isAccountPage={props.isAccountPage}
      />
    </div>
  );
}

function LeaderboardPosition(props: {
  top15?: RankAndCount;
  top60?: RankAndCount;
}): JSXElement {
  const format = getFormatting;

  return (
    <div class="grid w-full grid-cols-1 items-center gap-4 rounded bg-sub-alt p-4 text-sub md:grid-cols-2 lg:grid-cols-3">
      <span class="text-center md:col-span-2 lg:col-span-1">
        All-Time English Leaderboards
      </span>
      <Show when={props.top15 !== undefined}>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="justify-self-end">15 seconds</div>
          <div class="row-span-2 text-3xl text-text">
            {format().rank(props.top15?.rank)}
          </div>
          <div class="justify-self-end text-xs">
            {formatTopPercentage(props.top15)}
          </div>
        </div>
      </Show>
      <Show when={props.top60 !== undefined}>
        <div class="grid grid-cols-2 gap-x-4">
          <div class="justify-self-end">60 seconds</div>
          <div class="row-span-2 text-3xl text-text">
            {format().rank(props.top60?.rank)}
          </div>
          <div class="justify-self-end text-xs">
            {formatTopPercentage(props.top60)}
          </div>
        </div>
      </Show>
    </div>
  );
}
