import {Screen} from "@/widgets/Screen";
import {HomeHeader} from "@/pages/HomePage/widgets/HomeHeader";
import {TrendingSection} from "@/pages/HomePage/widgets/TrendingSection";
import {UpNextSection} from "@/pages/HomePage/widgets/UpNextSection";
import {WatchlistSection} from "@/pages/HomePage/widgets/WatchlistSection";

/** The first tab: the next episode to watch, series in progress, trending titles and the watchlist. */
export const HomePage = () => (
    <Screen>
        <HomeHeader/>
        <UpNextSection/>
        <TrendingSection/>
        <WatchlistSection/>
    </Screen>
);
