import Dijkstra from 'node-dijkstra';
import React, { Component } from 'react';
import {ForceGraph2D} from 'react-force-graph';
import {Dropdown, Menu, Step, Card, Breadcrumb} from 'semantic-ui-react';

import graphData from './data.js';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);

    //Initialize Dijkstra library used to pre-compute shortest paths
    let dijkstraGraph = new Dijkstra(graphData);
    //distanceTable is an Array of dijstra-computed distance & shortest path details
    // between each possible pair of nodes
    let distanceTable = [];
    //ui data
    let uiOptions = [];
    let nodes = [];
    let links = [];

    //For each each node
    for (let srcNode in graphData) {
      //format node data for ui
      nodes.push({id: srcNode});
      uiOptions.push({
        key: srcNode,
        value: srcNode,
        text: srcNode.toString().toLocaleUpperCase()
      });
      //for each link
      for(let destNode in graphData[srcNode]) {
        //format link data for ui
        links.push({
          source: srcNode,
          target: destNode,
          linkLabel: graphData[srcNode][destNode],
          linkDirectionalArrowLength: 1
        });
      }
      //For each other possible destination ( or node pair)
      for (let otherNode in graphData) {
        //pre-compute and store shortest path & distance
        let shortestPath = dijkstraGraph.path(srcNode, otherNode, { cost:true });
        if (srcNode === otherNode) {
          //dijkstraGraph returns a null path for recursive path like like [A->A] or [B->B] etc ...
          //we replace the null value in order to keep data consistent
          shortestPath.path = [srcNode, srcNode]
        }
        //finally insert the data in our magic lookup table
        distanceTable.push({
          src: srcNode,
          dest: otherNode,
          cost: shortestPath.cost,
          path: shortestPath.path
        });
      }
    }
    //initialize state
    this.state = {
      currentPath: null,
      origin: null,
      destination: null,
      distanceTable,
      uiOptions,
      uiGraphdata: {
        nodes,
        links
      },
      windowInnerWidth: null,
      windowInnerHeight: null
    };
  }

  //lookup precomputed distance table to find shortest path's data
  findShortestPath() {
    if (this.state.origin && this.state.destination) {
      this.state.distanceTable.forEach((row) => {
        if (row.src === this.state.origin && row.dest === this.state.destination) {
          this.setState({
            currentPath: row
          });
        }
      });
    }
  }

  //on origin dropdown change
  changeOrigin = (e, selectedOption) => {
    console.log('changeOrigin', selectedOption);
    this.setState({
      origin: selectedOption.value
    }, this.findShortestPath);
  };

  //on dest dropdown change
  changeDestination = (e, selectedOption) => {
    console.log('selectedOption', selectedOption);
    this.setState({
      destination: selectedOption.value
    }, this.findShortestPath);
  };

  //decide if a specific link should be highlighted
  setLinkHighlighting = (link) => {
    if (!this.state.currentPath || !Array.isArray(this.state.currentPath.path)) return 0;
    let path = this.state.currentPath.path;
    for (let i=0;i<=path.length-2; i++) {
      if (link.source.id === path[i] && link.target.id === path[i+1]) {
        return 4;
      }
    }
    return 0;
  };

  //paint node in HTML5 canvas
  paintNode = (node, ctx, globalScale) => {
    const isInPath = this.state.currentPath ? this.state.currentPath.path.indexOf(node.id) !== -1 : false;
    //circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
    ctx.strokeStyle = 'black';
    ctx.strokeWidth = .5/globalScale;
    ctx.stroke();
    ctx.fillStyle = isInPath ? 'red': 'white';
    ctx.fill();
    //label
    const label = node.id.toString().toUpperCase();
    const fontSize = 5;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'black';
    ctx.fillText(label, node.x, node.y);
  };

  componentDidMount() {
      window.addEventListener('resize', this.resizeCanvas);
      this.resizeCanvas();
  }

  resizeCanvas = () => {
    this.setState({
      windowInnerWidth: window.innerWidth,
      windowInnerHeight: window.innerHeight
    }, () => {
      if (this.refs.uiNodeGraph) {
        //zoom in and center
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
          // mobile
          this.refs.uiNodeGraph.zoom(2.8, 500);
        } else {
          // other than mobile
          this.refs.uiNodeGraph.zoom(5, 500);
        }
        this.refs.uiNodeGraph.centerAt(0, -5, 500);
      }
    });
  };

  render() {
    const {
      origin, destination, currentPath,
      uiGraphdata, uiOptions,
      windowInnerHeight, windowInnerWidth
    } = this.state;
    let originUP = origin ? origin.toUpperCase():null;
    let destUP = destination ? destination.toUpperCase():null;
    let pathInfo = null;
    //if path info is available : format details for presentation
    if (currentPath && Array.isArray(currentPath.path)) {
      if (currentPath.path.length) {
        pathInfo = currentPath ? (
          <Card>
            <Card.Content>
              <Card.Header>Path</Card.Header>
              <Card.Meta>
                <span>Cost : {currentPath.cost}</span>
              </Card.Meta>
              <Card.Description>
                <Breadcrumb>
                  {currentPath.path.map((el, i, arr) => {
                    let content = [<Breadcrumb.Section active={i===0 || i===arr.length-1}>{el.toUpperCase()}</Breadcrumb.Section>];
                    if (i !== (arr.length-1)) {
                      content.push(<Breadcrumb.Divider />);
                    }
                    return content;
                  })}
                </Breadcrumb>
              </Card.Description>
            </Card.Content>
          </Card>
        ): null;
      }
    }

    return (
      <div id="App-Component">
        <ForceGraph2D
          ref="uiNodeGraph"
          width={windowInnerWidth}
          height={windowInnerHeight}
          graphData={uiGraphdata}
          d3VelocityDecay={.15}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={this.setLinkHighlighting}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkVisibility={true}
          linkCurvature={.1}
          nodeCanvasObject={this.paintNode}
          style={{
            zIndex: 0,
            position: 'absolute'
          }}
        />
        <div id="toolbar">
          <Menu>
            <Dropdown key='dd-origin' fluid selection text={origin ? originUP:"From"} options={uiOptions} onChange={this.changeOrigin} />
            <Dropdown key='dd-dest' fluid selection text={destination ? destUP:"To"} options={uiOptions} onChange={this.changeDestination} />
          </Menu>
          {pathInfo}
        </div>
      </div>
    );
  }
}

export default App;
