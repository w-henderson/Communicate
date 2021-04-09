import React from "react";
import "./styles/App.scss";
import profilePicture from './images/placeholder_profile_picture.jpg';

import Menu from './components/Menu';

interface AppState {
  user: User | null
};

class App extends React.Component<{}, AppState> {
  componentDidMount() {
    // Set a virtual user for debugging before we add Firebase auth
    this.setState({
      user: {
        name: "William",
        profilePicture: profilePicture,
        id: "1c31d64f-8c57-481d-81a5-1a58acdabc5b"
      }
    });
  }

  render() {
    if (this.state !== null && this.state.user !== null) {
      return (
        <div className="App">
          <Menu user={this.state.user} />
        </div>
      );
    } else {
      return (
        <div></div>
      )
    }
  }
}

export default App;
