import { useCallback, useMemo, useState } from "react";

export interface KeepAliveStackPage {
  key: string;
}

export function useKeepAliveStack<TPage extends KeepAliveStackPage>(
  rootPage: TPage,
) {
  const [pages, setPages] = useState<TPage[]>([rootPage]);
  const activePage = pages[pages.length - 1]!;

  const pushPage = useCallback((page: TPage) => {
    setPages((items) => [...items, page]);
  }, []);

  const popPage = useCallback(() => {
    setPages((items) => (items.length > 1 ? items.slice(0, -1) : items));
  }, []);

  const replacePage = useCallback((page: TPage) => {
    setPages((items) => [...items.slice(0, -1), page]);
  }, []);

  const resetToRoot = useCallback(() => {
    setPages([rootPage]);
  }, [rootPage]);

  return useMemo(
    () => ({
      pages,
      activePage,
      pushPage,
      popPage,
      replacePage,
      resetToRoot,
    }),
    [activePage, pages, popPage, pushPage, replacePage, resetToRoot],
  );
}
