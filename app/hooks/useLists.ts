import { useCallback, useState } from "react";
import type { MovieList } from "~/models/movieList";
import { listsRepository } from "~/storage/repositories/listsRepository";
import { moviesRepository } from "~/storage/repositories/moviesRepository";

interface UseListsResult {
  lists: MovieList[];
  addList: (list: MovieList) => void;
  updateList: (list: MovieList) => void;
  removeList: (listId: string) => void;
  reorderLists: (orderedIds: string[]) => void;
}

export function useLists(): UseListsResult {
  const [lists, setLists] = useState<MovieList[]>(() => listsRepository.getAll());

  const addList = useCallback((list: MovieList) => {
    listsRepository.add(list);
    setLists(listsRepository.getAll());
  }, []);

  const updateList = useCallback((list: MovieList) => {
    listsRepository.update(list);
    setLists(listsRepository.getAll());
  }, []);

  const removeList = useCallback((listId: string) => {
    listsRepository.remove(listId);
    moviesRepository.removeByListId(listId);
    setLists(listsRepository.getAll());
  }, []);

  const reorderLists = useCallback((orderedIds: string[]) => {
    listsRepository.reorder(orderedIds);
    setLists(listsRepository.getAll());
  }, []);

  return { lists, addList, updateList, removeList, reorderLists };
}
