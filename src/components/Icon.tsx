import React from "react";

class Icon extends React.Component {
  render() {
    return (
      <i className="material-icons-round">
        {this.props.children}
      </i>
    );
  }
}

export default Icon;
