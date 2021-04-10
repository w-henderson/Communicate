import React from "react";

class Icon extends React.Component {
  render() {
    return (
      <i className={`bi bi-${this.props.children}`}></i>
    );
  }
}

export default Icon;
