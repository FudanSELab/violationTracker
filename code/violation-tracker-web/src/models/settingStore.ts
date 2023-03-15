import Cookies from 'js-cookie';
import { action, makeAutoObservable, observable } from 'mobx';

export default class SettingStore {
  @observable showDimission: boolean = false;
  constructor() {
    makeAutoObservable(this);
  }
  @action setShowDimission(show: boolean) {
    this.showDimission = show;
    Cookies.set('showDimission', JSON.stringify(show));
  }
  @action getDataFromStorage = () => {
    this.setShowDimission(
      JSON.parse((Cookies.get('showDimission') as any) || 'false'),
    );
  };
}
