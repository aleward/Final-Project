import {vec3} from 'gl-matrix';
import {mat4, vec4} from 'gl-matrix';
import {gl} from './globals';


export class MinPQ {
    private maxN: number;        // maximum number of elements on PQ
    private n: number;           // number of elements on PQ
    private pq: number[];        // binary heap using 1-based indexing
    private qp: number[];        // inverse of pq - qp[pq[i]] = pq[qp[i]] = i
    private keys: number[];      // keys[i] = priority of i

    /**
     * Initializes an empty indexed priority queue with indices between {@code 0}
     * and {@code maxN - 1}.
     * @param  maxN the keys on this priority queue are index from {@code 0}
     *         {@code maxN - 1}
     * @throws IllegalArgumentException if {@code maxN < 0}
     */
    constructor(maxN: number) {
        if (this.maxN < 0) console.log("MINPQ CONSTRUCTOR ERROR");
        this.maxN = maxN;
        this.n = 0;
        this.keys = []; // all should be length maxN + 1
        this.pq   = [];
        this.qp   = [];
        for (let i = 0; i <= maxN; i++)
            this.qp[i] = -1;
    }


    /***************************************************************************
    * General helper functions.
    ***************************************************************************/
    private greater(i: number, j: number) {
        return this.keys[this.pq[i]] > this.keys[this.pq[j]];
    }

    private exch(i: number, j: number) {
        let swap: number = this.pq[i];
        this.pq[i] = this.pq[j];
        this.pq[j] = swap;
        this.qp[this.pq[i]] = i;
        this.qp[this.pq[j]] = j;
    }


   /***************************************************************************
    * Heap helper functions.
    ***************************************************************************/
    private swim(k: number) {
        while (k > 1 && this.greater(k/2, k)) {
            this.exch(k, k/2);
            k = k/2;
        }
    }

    private sink(k: number) {
        while (2*k <= this.n) {
            let j: number = 2*k;
            if (j < this.n && this.greater(j, j+1)) j++;
            if (!this.greater(k, j)) break;
            this.exch(k, j);
            k = j;
        }
    }



    /**
     * Returns true if this priority queue is empty.
     *
     * @return {@code true} if this priority queue is empty;
     *         {@code false} otherwise
     */
    isEmpty(): boolean {
        return this.n == 0;
    }

    /**
     * Is {@code i} an index on this priority queue?
     *
     * @param  i an index
     * @return {@code true} if {@code i} is an index on this priority queue;
     *         {@code false} otherwise
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     */
    contains(i: number): boolean {
        if (i < 0 || i >= this.maxN) console.log("MINPQ CONTAINS FUNCTION ERROR");
        return this.qp[i] != -1;
    }

    /**
     * Returns the number of keys on this priority queue.
     *
     * @return the number of keys on this priority queue
     */
    size(): number {
        return this.n;
    }

    /**
     * Associates key with index {@code i}.
     *
     * @param  i an index
     * @param  key the key to associate with index {@code i}
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @throws IllegalArgumentException if there already is an item associated
     *         with index {@code i}
     */
    insert(i: number, key: number) {
        if (i < 0 || i >= this.maxN) console.log("MINPQ INSERT FUNCTION ERROR");
        if (this.contains(i)) console.log("index is already in the priority queue");
        this.n++;
        this.qp[i] = this.n;
        this.pq[this.n] = i;
        this.keys[i] = key;
        this.swim(this.n);
    }

    /**
     * Returns an index associated with a minimum key.
     *
     * @return an index associated with a minimum key
     * @throws NoSuchElementException if this priority queue is empty
     */
    minIndex(): number {
        if (this.n == 0) console.log("Priority queue underflow");
        return this.pq[1];
    }

    /**
     * Returns a minimum key.
     *
     * @return a minimum key
     * @throws NoSuchElementException if this priority queue is empty
     */
    minKey(): number {
        if (this.n == 0) console.log("Priority queue underflow");
        return this.keys[this.pq[1]];
    }

    /**
     * Removes a minimum key and returns its associated index.
     * @return an index associated with a minimum key
     * @throws NoSuchElementException if this priority queue is empty
     */
    delMin(): number {
        if (this.n == 0) console.log("Priority queue underflow");
        let min: number = this.pq[1];
        this.exch(1, this.n--);
        this.sink(1);
        if (min != this.pq[this.n+1]) console.log("ASSERTION ERROR DELMIN");
        this.qp[min] = -1;        // delete
        this.keys[min] = null;    // to help with garbage collection
        this.pq[this.n+1] = -1;        // not needed
        return min;
    }

    /**
     * Returns the key associated with index {@code i}.
     *
     * @param  i the index of the key to return
     * @return the key associated with index {@code i}
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @throws NoSuchElementException no key is associated with index {@code i}
     */
    keyOf(i: number): number {
        if (i < 0 || i >= this.maxN) console.log("MINPQ KEYOF ERROR");
        if (!this.contains(i)) console.log("index is not in the priority queue");
        else return this.keys[i];
    }

    /**
     * Change the key associated with index {@code i} to the specified value.
     *
     * @param  i the index of the key to change
     * @param  key change the key associated with index {@code i} to this key
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @throws NoSuchElementException no key is associated with index {@code i}
     */
    changeKey(i: number, key: number) {
        if (i < 0 || i >= this.maxN) console.log("MINPQ CHANGEKEY ERROR");
        if (!this.contains(i)) console.log("index is not in the priority queue");
        this.keys[i] = key;
        this.swim(this.qp[i]);
        this.sink(this.qp[i]);
    }

    /**
     * Change the key associated with index {@code i} to the specified value.
     *
     * @param  i the index of the key to change
     * @param  key change the key associated with index {@code i} to this key
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @deprecated Replaced by {@code changeKey(int, Key)}.
     */
    change(i: number, key: number) {
        this.changeKey(i, key);
    }

    /**
     * Decrease the key associated with index {@code i} to the specified value.
     *
     * @param  i the index of the key to decrease
     * @param  key decrease the key associated with index {@code i} to this key
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @throws IllegalArgumentException if {@code key >= keyOf(i)}
     * @throws NoSuchElementException no key is associated with index {@code i}
     */
    decreaseKey(i: number, key: number) {
        if (i < 0 || i >= this.maxN) console.log("MIN PQ DECREASE KEY ERROR");
        if (!this.contains(i)) console.log("index is not in the priority queue");
        if (this.keys[i] <= key)
            console.log("Calling decreaseKey() with given argument would not strictly decrease the key");
        this.keys[i] = key;
        this.swim(this.qp[i]);
    }

    /**
     * Increase the key associated with index {@code i} to the specified value.
     *
     * @param  i the index of the key to increase
     * @param  key increase the key associated with index {@code i} to this key
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @throws IllegalArgumentException if {@code key <= keyOf(i)}
     * @throws NoSuchElementException no key is associated with index {@code i}
     */
    increaseKey(i: number, key: number) {
        if (i < 0 || i >= this.maxN) console.log("MINPQ INCREASEKEY ERROR");
        if (!this.contains(i)) console.log("index is not in the priority queue");
        if (this.keys[i] >= key)
            console.log("Calling increaseKey() with given argument would not strictly increase the key");
        this.keys[i] = key;
        this.sink(this.qp[i]);
    }

    /**
     * Remove the key associated with index {@code i}.
     *
     * @param  i the index of the key to remove
     * @throws IllegalArgumentException unless {@code 0 <= i < maxN}
     * @throws NoSuchElementException no key is associated with index {@code i}
     */
    delete(i: number) {
        if (i < 0 || i >= this.maxN) console.log("MINPQ DELETE ERROR");
        if (!this.contains(i)) console.log("index is not in the priority queue");
        let index: number = this.qp[i];
        this.exch(index, this.n--);
        this.swim(index);
        this.sink(index);
        this.keys[i] = null;
        this.qp[i] = -1;
    }

}

export class Edge {
    private v: number;
    private w: number;
    private weight: number;

    /**
     * Initializes an edge between vertices {@code v} and {@code w} of
     * the given {@code weight}.
     *
     * @param  v one vertex
     * @param  w the other vertex
     * @param  a first vertex's location
     * @param  b second vertex's location
     * @throws IllegalArgumentException if either {@code v} or {@code w} 
     *         is a negative integer
     * @throws IllegalArgumentException if {@code weight} is {@code NaN}
     */
    constructor(v: number, w: number, a: number[], b: number[]) {
        if (v < 0) console.log("vertex index must be a nonnegative integer");
        if (w < 0) console.log("vertex index must be a nonnegative integer");
        
        let xDist = b[0] - a[0];
        let zDist = b[1] - a[1];
        let dist: number = Math.sqrt(xDist * xDist + zDist * zDist);
        
        this.v = v;
        this.w = w;
        this.weight = dist;
    }

    /**
     * Returns the weight of this edge.
     *
     * @return the weight of this edge
     */
    getWeight(): number {
        return this.weight;
    }

    /**
     * Returns either endpoint of this edge.
     *
     * @return either endpoint of this edge
     */
    either(): number {
        return this.v;
    }

    /**
     * Returns the endpoint of this edge that is different from the given vertex.
     *
     * @param  vertex one endpoint of this edge
     * @return the other endpoint of this edge
     * @throws IllegalArgumentException if the vertex is not one of the
     *         endpoints of this edge
     */
    other(vertex: number): number {
        if      (vertex == this.v) return this.w;
        else if (vertex == this.w) return this.v;
        else console.log("Illegal endpoint");
    }

    /**
     * Compares two edges by weight.
     * Note that {@code compareTo()} is not consistent with {@code equals()},
     * which uses the reference equality implementation inherited from {@code Object}.
     *
     * @param  that the other edge
     * @return a negative integer, zero, or positive integer depending on whether
     *         the weight of this is less than, equal to, or greater than the
     *         argument edge
     */
    compareTo(that: Edge): number {
        if (this.weight < that.weight) {
            return -1;
        } else if (this.weight == that.weight) {
            return 0;
        } else {
            return 1;
        }
    }
}

export class EdgeWeightedGraph {

    private V: number;
    private E: number;
    private adj: any[]; //an array of edge arrays

    /**
     * Initializes a random edge-weighted graph with {@code V} vertices and <em>E</em> edges.
     *
     * @param  point the center points of each island
     * @throws IllegalArgumentException if {@code V < 0}
     * @throws IllegalArgumentException if {@code E < 0}
     */
    constructor(points: any[]) {
        this.V = points.length;
        this.E = 0;
        this.adj = [];

        for (let i = 0; i < this.V; i++) {
            this.adj[i] = [];
        }

        for (let v = 0; v < this.V - 1; v++) {
            for (let w = v + 1; w < this.V; w++) {
                let e: Edge = new Edge(v, w, points[v], points[w]);
                this.addEdge(e);
            }
        }
    }

    /**
     * Returns the number of vertices in this edge-weighted graph.
     *
     * @return the number of vertices in this edge-weighted graph
     */
    getV(): number {
        return this.V;
    }

    /**
     * Returns the number of edges in this edge-weighted graph.
     *
     * @return the number of edges in this edge-weighted graph
     */
    getE(): number {
        return this.E;
    }

    // throw an IllegalArgumentException unless {@code 0 <= v < V}
    validateVertex(v: number) {
        if (v < 0 || v >= this.V)
            console.log("vertex " + v + " is not between 0 and " + (this.V-1));
    }

    /**
     * Adds the undirected edge {@code e} to this edge-weighted graph.
     *
     * @param  e the edge
     * @throws IllegalArgumentException unless both endpoints are between {@code 0} and {@code V-1}
     */
    addEdge(e: Edge) {
        let v: number = e.either();
        let w: number = e.other(v);
        this.validateVertex(v);
        this.validateVertex(w);
        this.adj[v].push(e);
        this.adj[w].push(e);
        this.E++;
    }

    /**
     * Returns the edges incident on vertex {@code v}.
     *
     * @param  v the vertex
     * @return the edges incident on vertex {@code v} as an Iterable
     * @throws IllegalArgumentException unless {@code 0 <= v < V}
     */
    getAdj(v: number): Edge[] {
        this.validateVertex(v);
        return this.adj[v];
    }

    /**
     * Returns the degree of vertex {@code v}.
     *
     * @param  v the vertex
     * @return the degree of vertex {@code v}               
     * @throws IllegalArgumentException unless {@code 0 <= v < V}
     */
    degree(v: number): number {
        this.validateVertex(v);
        return this.adj[v].length;
    }

    /**
     * Returns all edges in this edge-weighted graph.
     * To iterate over the edges in this edge-weighted graph, use foreach notation:
     * {@code for (Edge e : G.edges())}.
     *
     * @return all edges in this edge-weighted graph, as an iterable
     */
    edges(): Edge[] {
        let list: Edge[] = [];
        for (let v = 0; v < this.V; v++) {
            let selfLoops: number = 0;
            let e: Edge[] = this.getAdj(v);
            for (let i = 0; i < e.length; i++) {
                if (e[i].other(v) > v) {
                    list.push(e[i]);
                }
                // add only one copy of each self loop (self loops will be consecutive)
                else if (e[i].other(v) == v) {
                    if (selfLoops % 2 == 0) list.push(e[i]);
                    selfLoops++;
                }
            }
        }
        return list;
    }

}

export class Dijkstra {
    private distTo: number[];          // distTo[v] = distance  of shortest s->v path
    private edgeTo: Edge[];            // edgeTo[v] = last edge on shortest s->v path
    private pq: MinPQ;    // priority queue of vertices

    // throw an IllegalArgumentException unless {@code 0 <= v < V}
    private validateVertex(v: number) {
        let V: number = this.distTo.length;
        if (v < 0 || v >= V)
            console.log("vertex " + v + " is not between 0 and " + (V-1));
    }

    /**
     * Computes a shortest-paths tree from the source vertex {@code s} to every
     * other vertex in the edge-weighted graph {@code G}.
     *
     * @param  G the edge-weighted digraph
     * @param  s the source vertex
     * @throws IllegalArgumentException if an edge weight is negative
     * @throws IllegalArgumentException unless {@code 0 <= s < V}
     */
    constructor(points: any[], s: number) { //EdgeWeightedGraph G, int s) {
        let G: EdgeWeightedGraph = new EdgeWeightedGraph(points);
        let e: Edge[] = G.edges();

        for (let i = 0; i < e.length; i++) {
            if (e[i].getWeight() < 0)
                console.log("edge " + e + " has negative weight");
        }

        this.distTo = []  // length = number of vertices //new double[G.V()];
        this.edgeTo = []  // length = number of vertices //new Edge[G.V()];

        this.validateVertex(s);

        for (let v = 0; v < G.getV(); v++)
            this.distTo[v] = Number.POSITIVE_INFINITY;
        this.distTo[s] = 0.0;

        // relax vertices in order of distance from s
        this.pq = new MinPQ(G.getV());
        this.pq.insert(s, this.distTo[s]);
        while (!this.pq.isEmpty()) {
            let v: number = this.pq.delMin();
            let adjEdges: Edge[] = G.getAdj(v);
            for (let i = 0; i < adjEdges.length; i++) {
                this.relax(adjEdges[i], v);
            }
        }

        // // check optimality conditions
        // if (!this.check(G, s)) console.log("ASSERT ERROR DIJ");
    }

    // relax edge e and update pq if changed
    private relax(e: Edge, v: number) {
        let w: number = e.other(v);
        if (this.distTo[w] > this.distTo[v] + e.getWeight()) {
            this.distTo[w] = this.distTo[v] + e.getWeight();
            this.edgeTo[w] = e;
            if (this.pq.contains(w)) this.pq.decreaseKey(w, this.distTo[w]);
            else                     this.pq.insert(w, this.distTo[w]);
        }
    }

    /**
     * Returns the length of a shortest path between the source vertex {@code s} and
     * vertex {@code v}.
     *
     * @param  v the destination vertex
     * @return the length of a shortest path between the source vertex {@code s} and
     *         the vertex {@code v}; {@code Double.POSITIVE_INFINITY} if no such path
     * @throws IllegalArgumentException unless {@code 0 <= v < V}
     */
    getDistTo(v: number): number {
        this.validateVertex(v);
        return this.distTo[v];
    }

    /**
     * Returns true if there is a path between the source vertex {@code s} and
     * vertex {@code v}.
     *
     * @param  v the destination vertex
     * @return {@code true} if there is a path between the source vertex
     *         {@code s} to vertex {@code v}; {@code false} otherwise
     * @throws IllegalArgumentException unless {@code 0 <= v < V}
     */
    hasPathTo(v: number) {
        this.validateVertex(v);
        return this.distTo[v] < Number.POSITIVE_INFINITY;
    }

    /**
     * Returns a shortest path between the source vertex {@code s} and vertex {@code v}.
     *
     * @param  v the destination vertex
     * @return a shortest path between the source vertex {@code s} and vertex {@code v};
     *         {@code null} if no such path
     * @throws IllegalArgumentException unless {@code 0 <= v < V}
     */
    pathTo(v: number): Edge[] {
        this.validateVertex(v);
        if (!this.hasPathTo(v)) return null;
        let path: Edge[] = [];
        let x: number = v.valueOf(); //?CHECK THIS
        for (let e: Edge = this.edgeTo[v]; e != null; e = this.edgeTo[x]) {
            path.push(e);
            x = e.other(x);
        }
        return path;
    }

}


export class PrimMST {
    private FLOATING_POINT_EPSILON: number = 1E-12;

    private edgeTo: Edge[];        // edgeTo[v] = shortest edge from tree vertex to non-tree vertex
    private distTo: number[];      // distTo[v] = weight of shortest such edge
    private marked: boolean[];     // marked[v] = true if v on tree, false otherwise
    private pq: MinPQ;

    /**
     * Compute a minimum spanning tree (or forest) of an edge-weighted graph.
     * @param G the edge-weighted graph
     */
    constructor(points: any[]) {
        let G: EdgeWeightedGraph = new EdgeWeightedGraph(points);

        this.edgeTo = []; // length G.getV();
        this.distTo = []; // "
        this.marked = []; // "
        this.pq = new MinPQ(G.getV());
        for (let v = 0; v < G.getV(); v++)
            this.distTo[v] = Number.POSITIVE_INFINITY;

        for (let v = 0; v < G.getV(); v++)      // run from each vertex to find
            if (!this.marked[v]) this.prim(G, v);      // minimum spanning forest

        // check optimality conditions
        //if (!this.check(G)) console.log("ASSERT ERROR DIJ");
    }

    // run Prim's algorithm in graph G, starting from vertex s
    private prim(G: EdgeWeightedGraph, s: number) {
        this.distTo[s] = 0.0;
        this.pq.insert(s, this.distTo[s]);
        while (!this.pq.isEmpty()) {
            let v: number = this.pq.delMin();
            this.scan(G, v);
        }
    }

    // scan vertex v
    private scan(G: EdgeWeightedGraph, v: number) {
        this.marked[v] = true;
        let e: Edge[] = G.getAdj(v);
        for (let i = 0; i < e.length; i++) {
            let w: number = e[i].other(v);
            if (this.marked[w]) continue;         // v-w is obsolete edge
            if (e[i].getWeight() < this.distTo[w]) {
                this.distTo[w] = e[i].getWeight();
                this.edgeTo[w] = e[i];
                if (this.pq.contains(w)) this.pq.decreaseKey(w, this.distTo[w]);
                else                     this.pq.insert(w, this.distTo[w]);
            }
        }
    }

    /**
     * Returns the edges in a minimum spanning tree (or forest).
     * @return the edges in a minimum spanning tree (or forest) as
     *    an array of edges
     */
    edges(): Edge[] {
        let mst: Edge[] = [];
        for (let v = 0; v < this.edgeTo.length; v++) {
            let e: Edge = this.edgeTo[v];
            if (e != null) {
                mst.push(e);
            }
        }
        return mst;
    }

    /**
     * Returns the sum of the edge weights in a minimum spanning tree (or forest).
     * @return the sum of the edge weights in a minimum spanning tree (or forest)
     */
    weight(): number {
        let weight: number = 0.0;
        let ed: Edge[] = this.edges();
        for (let i = 0; i < ed.length; i++) {
            weight += ed[i].getWeight();
        }
        return weight;
    }

}
