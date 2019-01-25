import React from 'react';
import ReactMarkdown from 'react-markdown';

class FileViewer extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      fileLoaded: false,
      fileText  : '',
    };
  }

  componentDidMount () {
    const {sourceUrl} = this.props;
    fetch(sourceUrl)
      .then(response => response.text())
      .then((text) => {
        this.setState({fileText: text});
        this.setState({fileLoaded: true});

        return true;
      })
      .catch(e => { console.log(e) });
  }

  render () {
    return (
      <div>
        {
          this.state.fileLoaded &&
          <ReactMarkdown source={this.state.fileText}/>
        }
        {
          !this.state.fileLoaded &&
          <p>Loading your file...</p>
        }
      </div>
    );
  }
}

export default FileViewer;
