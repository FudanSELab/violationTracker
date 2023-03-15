import { createContext, useContext } from 'react';
import { NavigateFunction, Location, Path } from 'react-router-dom';

export interface THistory {
  goBack: () => void;
  push: (val: Partial<Path> | string) => void;
  replace: (url: string) => void;
}
type THistoryContext = {
  history: THistory;
  navigate: NavigateFunction;
  location: Location;
};

const HistoryContext = createContext<THistoryContext>({} as THistoryContext);
export const useHistory = () => useContext(HistoryContext);

export default HistoryContext;
