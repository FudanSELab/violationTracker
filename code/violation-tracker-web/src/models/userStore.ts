import Cookies from 'js-cookie';
import { action, computed, makeAutoObservable, observable } from 'mobx';

export default class UserStore {
  @observable userAvatar: string = 'https://picsum.photos/144/144';
  @observable userToken: string = '';
  @observable username: string = '';
  @observable userRight: number = -1;
  constructor() {
    makeAutoObservable(this);
  }
  @action
  setUser = ({
    userToken = '',
    username = '',
    userRight = -1,
    userAvatar = 'https://picsum.photos/144/144',
  }: {
    userToken?: string;
    username?: string;
    userRight?: number;
    userAvatar?: string;
  }) => {
    this.userToken = userToken;
    this.username = username;
    this.userRight = userRight;
    this.userAvatar = userAvatar;
    sessionStorage.setItem('userToken', this.userToken);
    sessionStorage.setItem('userName', this.username);
    sessionStorage.setItem('userRight', `${this.userRight}`);
    sessionStorage.setItem('userAvatar', this.userAvatar);
    Cookies.set('userToken', this.userToken);
    Cookies.set('username', this.username);
    Cookies.set('userRight', `${this.userRight}`);
    Cookies.set('userAvatar', this.userAvatar);
  };
  @action getDataFromStorage = () => {
    this.setUser({
      userToken:
        sessionStorage.getItem('userToken') ?? Cookies.get('userToken') ?? '',
      username:
        sessionStorage.getItem('username') ?? Cookies.get('username') ?? '',
      userRight: +(
        sessionStorage.getItem('userRight') ??
        Cookies.get('userRight') ??
        -1
      ),
      userAvatar:
        sessionStorage.getItem('userAvatar') ?? Cookies.get('userAvatar') ?? '',
    });
  };
  // @action setDataFromSessionStorage = () => {
  //   sessionStorage.setItem('userToken', this.userToken);
  //   sessionStorage.setItem('userName', this.username);
  //   sessionStorage.setItem('userRight', `${this.userRight}`);
  // };
  @computed get isMaintainer() {
    return this.userRight === 0 || this.userRight === 1;
  }
  @computed get login() {
    return (
      this.userToken !== '' && this.username !== '' && this.userRight !== -1
    );
  }
}
