## Table of contents

- [Description](#description)
- [Install & Run](#install--run)
- [Theory](#theory)
  * [In Real Time](#in-real-time)
  * [In Advance](#in-advance)
  * [Hub-Labels](#hub-labels)
- [Practice](#practice)
- [Scalability](#scalability)
- [Source](#source)
- [TODO](#todo)

## Description

Shows the shortest path between 2 nodes in a weighted directed graph, which is often used to represent rail/road networks.

## Install & Run
```bash
yarn install && yarn start
```

## Theory

There are multiple ways to approach this : 

### In Real Time

One solution is to compute the shortest path for a source & a destination simply when the user demands it.

**PROS** : Fast to implement

**CONS** : Running such algorithm relies heavily on the CPU and memory. Response timings may vary as the graph gets bigger and users make more concurrent queries

### In Advance

Another solution is to pre-compute all possible shortest paths and store them. Then we query our store/database of answers when the user needs it. The results are computed at initialisation of the software or even separately.

**PROS** : Scalable, best for large production application with large graph with multiple users and concurrent queries. We can decide when we compute the shortest paths thus giving us more control on when the computational power (CPU/memory) is required. Without impacting production's timings.  

**CONS** : Database intensive, DB needs optimisation, Need to rebuild DB every time the graph changes,

In other words we have to decide between REAL-TIME vs PREPARED COMPUTATION : NOW vs IN ADVANCE

For large, real world applications, it is most suited to use some sort of preparation. Of all the current method, one stands out : The Hub-Labelling method. 

### Hub-Labels

In a nutshell, it uses a forward and a reverse table of all distance between node in the database, all it then takes is an SQL query to retrieve the the shortest path with one.

Forward table :

| Node          | Hub           | Distance  |
|:-------------:|:-------------:| ---------:|
| A             | A             | 0         |
| A             | B             | 4         |
| A             | C             | 10        |
| B             | C             | 8         |
| ...           | ...           | ...       |

Reverse table :

| Node          | Hub           | Distance  |
|:-------------:|:-------------:| ---------:|
| A             | A             | 0         |
| B             | A             | 4         |
| C             | A             | 10        |
| C             | B             | 8         |
| ...           | ...           | ...       |

```sql
SELECT 
  MIN (forward.dist+reverse.dist)
FROM 
  forward, reverse
WHERE 
  forward.node = s 
  AND reverse.node = t 
  AND forward.hub = reverse.hub

```

In case of a large application (many nodes, many users) a simple SQL query on a well optimised database can outperform other methods. Probably because the sum of the CPU+RAM+Input/Output resources are less than when running a path-finding algorithm. Actually It is, the fastest known solution to this day for application working with road network. (see sources).

## Practice

To solve this problem I chose a solution inspired from Hub-Labels. We will compute the answers at initialisation however we will store the results in memory as opposed to the database and in a simpler data structure. 

This prototype is built with :

NodeJS for its versatility its large number of open source modules.

React the fast and lightweight view framework for the front-end, paired with a 2D node-graph component making use of the canvas/webgl api and using semantic-ui components. O(V)

I chose the Dijkstra Algorithm and its NodeJS package, in order to compute All-pairs shortest paths. An alternative could have been the Floyd-Warshall Algorithm. I could not find any particular benchmark on these algorithm, so this is to be studied further...

## Scalability

For scalability of the Hub-Labeling solution in a real-world application, I would use a database to store all-pairs shortest paths like the original solution in the Theory section. this solution will require a system of load balancers to dispatch queries to servers hosting database mirrors, optimized for our specific needs using index and caching mechanism. Also showing billions of node in the UI would probably be counter-productive, we could insteaad only show a region or only the path. Since this solution is mostly Input/Output bound, I believe any Framework/Language can be used. NodeJS is a perfect candidate because of its asynchronous non-blocking i/o optimized nature, it can deal without a large number of concurrent network/DB/Filesystem connection and keep timings optimum. 

## Source:
Andrew Goldberg on Hub-Labelling

[Article](https://www.microsoft.com/en-us/research/publication/a-hub-based-labeling-algorithm-for-shortest-paths-on-road-networks/)

[Presentation](https://www.youtube.com/watch?v=OK40Gfgdyz8)

[Wikipedia on the problem of the shortest path](https://en.wikipedia.org/wiki/Shortest_path_problem)

## TODO

-Unit testing

-Benchmark All-pairs shortest path algorithms

This project was bootstrapped with [Create React App](https://github.com/facebookincubator/create-react-app).