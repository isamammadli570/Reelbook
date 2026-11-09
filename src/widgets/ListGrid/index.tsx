import {View} from "react-native";
import {ListCard} from "@/widgets/ListCard";
import {POSTER_GAP, usePosterWidth} from "@/hooks/usePosterWidth";
import type {UserList} from "@/api/lists.api";

type ListGridProps = {
    lists: UserList[];
    /** Where each list opens; your own list pages unless given. */
    listHref?: (listId: string) => string;
};

/** Lists two to a row. */
export const ListGrid = ({lists, listHref}: ListGridProps) => {
    const width = usePosterWidth(2);

    return (
        <View className="flex-row flex-wrap" style={{gap: POSTER_GAP}}>
            {lists.map((list, index) => <ListCard key={list.id} list={list} width={width} href={listHref?.(list.id)} index={index}/>)}
        </View>
    );
};
