import React from "react";
import Icon from './Icon';
import '../styles/SearchBar.scss';

interface SearchBarProps {
  hidden: boolean,
  getUserByEmail: (email: string) => Promise<User | null>,
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
    this.submit = this.submit.bind(this);
    this.wasHidden = false;
  }

  checkForSubmit(e: React.KeyboardEvent) {
    this.setState({ showingRedOutline: false });
    if (e.key === "Enter") this.submit();
  }

  async submit() {
    let recipient = await this.props.getUserByEmail(this.state.query);
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

export default SearchBar;
