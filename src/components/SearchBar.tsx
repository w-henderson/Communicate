import React from "react";
import Icon from './Icon';
import FirebaseContext from "../contexts/FirebaseContext";
import '../styles/SearchBar.scss';

interface SearchBarProps {
  hidden: boolean,
  createConversation: (recipient: User) => void
}

interface SearchBarState {
  query: string,
  showingRedOutline: boolean
}

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
  wasHidden: boolean;

  constructor(props) {
    super(props);

    this.state = {
      query: "",
      showingRedOutline: false
    };

    this.checkForSubmit = this.checkForSubmit.bind(this);
    this.getUserByEmail = this.getUserByEmail.bind(this);
    this.submit = this.submit.bind(this);
    this.wasHidden = false;
  }

  getUserByEmail(email: string): Promise<User | null> {
    if (email === this.context.user?.emailAddress) return Promise.resolve(null);

    let ref = this.context.database.ref("users").orderByChild("emailAddress").equalTo(email);
    return ref.once("value").then(async snapshot => {
      let value = snapshot.val();
      if (value === null) return null;
      let uid = Object.keys(value)[0];
      value = value[uid];

      let name = value.name;
      let profilePicture = await this.context.storage.ref(value.profilePicture).getDownloadURL();

      return {
        name,
        id: uid,
        profilePicture,
        emailAddress: value.emailAddress
      };
    });
  }

  checkForSubmit(e: React.KeyboardEvent) {
    this.setState({ showingRedOutline: false });
    if (e.key === "Enter") this.submit();
  }

  async submit() {
    let recipient = await this.getUserByEmail(this.state.query);
    if (recipient !== null) {
      this.props.createConversation(recipient);
      this.setState({ query: "", showingRedOutline: false });
    }
    else this.setState({ showingRedOutline: true });
  }

  render() {
    if (this.props.hidden) this.wasHidden = true;

    return (
      <div className={this.props.hidden ? "SearchBar hidden" : "SearchBar"}>
        <input
          placeholder="Type an email address"
          value={this.state.query}
          onChange={e => this.setState({ query: e.target.value })}
          onKeyDown={this.checkForSubmit}
          className={this.state.showingRedOutline ? "incorrect" : undefined} />
        <Icon onClick={this.submit}>person-plus-fill</Icon>
      </div>
    );
  }

  componentDidUpdate() {
    if (!this.props.hidden && this.wasHidden) {
      let input: HTMLElement | null = document.querySelector("div.SearchBar input");
      input?.focus();
      this.wasHidden = false;
    }
  }
}

SearchBar.contextType = FirebaseContext;

export default SearchBar;
