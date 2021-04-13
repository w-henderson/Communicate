import React from "react";
import Icon from './Icon';
import '../styles/SearchBar.scss';

interface SearchBarProps {
  hidden: boolean
}

class SearchBar extends React.Component<SearchBarProps> {
  render() {
    return (
      <div className={this.props.hidden ? "SearchBar hidden" : "SearchBar"}>
        <input placeholder="Type an email address" />
        <Icon>person-plus-fill</Icon>
      </div>
    );
  }
}

export default SearchBar;
