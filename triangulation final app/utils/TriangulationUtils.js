
/**
 * Create array of triangles features
 * @param {Array.<Object>} data - array of features transformed from GeoJSON
 * @returns {Array.<Object>}  array of features, every three consecutive features form a triangle
 * 
 */
export function createTrianglesFeatures(data){
  let features = [];
  let coords = [];

  data.forEach(feature => coords.push(feature.coordinates));
  let triangles = triangulate(coords);
  //console.log(findDuplicateFeatures(data,coords))

  triangles.forEach(triangle => {
    triangle.forEach(point => {

      for (const feature of data) {  
        let coords = feature.coordinates;
        if(coords[0] === point[0] && coords[1] === point[1]){
          features.push(feature);
          break;
        } 
      }
    });
  });

  return features;
}

/**
 * Create array of triangles indexes
 * @param {Array.<Object>} data - array of features transformed from GeoJSON
 * @returns {number[]} array of indexes, every three consecutive indexes form a triangle
 * 
 */
export function getTrianglesIndexes(data){

  let indexes = [];
  let coords = [];

  data.forEach(feature => coords.push(feature.coordinates));

  let triangles = triangulate(coords);

  triangles.forEach(triangle => {
    triangle.forEach(point => {

      for (const [index, feature] of data.entries()) {  
        let coords = feature.coordinates;
        if(coords[0] === point[0] && coords[1] === point[1]){
          indexes.push(index);
          break;
        } 
      }
    });
  });
  return indexes;
}

/**
 * Create array of duplicated features
 * @param {Array.<Object>} data - array of features transformed from GeoJSON
 * @param {number[][]} coords - array of feature coordinates [[x1,y1],[x2,y2]...]
 * @returns {Array.<Object>} array of all features with same coordinates
 * 
 */
function findDuplicateFeatures(data, coords){
  let duplicates = [];
  let temp = []

  coords.forEach(coord => {
    temp.forEach(tempCoord => {
      if(tempCoord[0] === coord[0] && tempCoord[1] === coord[1]){
        duplicates.push(coord)
      }
    });
    temp.push(coord)
  });

  let duplicateFeatures = [];

  duplicates.forEach(point => {
    data.forEach(feature => {
      let coords = feature.coordinates;
      if(coords[0] === point[0] && coords[1] === point[1]){
        duplicateFeatures.push(feature); 
      } 
    });
  });

  return duplicateFeatures;
}

/**
 * Create array of lines features
 * @param {Array.<Object>} trianglePoints - array of features, every three consecutive features form a triangle
 * @returns {Array.<Object>}  array of features, every two consecutive features form edge of triangle
 * 
 */
export function createLinesFeatures(triangleFeatures){
  let features = [];

  triangleFeatures.forEach((feature, i) => { 

    switch ((i+1)%3) {
      case 1:
        features.push(feature)
        break;
      case 2:
        features.push(feature,feature)
        break;
      case 0:
        features.push(feature,feature, triangleFeatures[i-2])
        break;
      default:
        break;
      }
    });
    return features;
  }

/**
 * Create array of indexes features
 * @param {number[]} triangleIndexes - array of indexes, every three consecutive indexes form a triangle
 * @returns {number[]} array of indexes, every two consecutive indexes form edge of triangle
 * 
 */
  export function createLinesIndexes(triangleIndexes){
    let indexes = [];

   triangleIndexes.forEach((index, i) => { 
  
      switch ((i+1)%3) {
        case 1:
          indexes.push(index)
          break;
        case 2:
          indexes.push(index)
          indexes.push(index) 
          break;
        case 0:
          indexes.push(index)
          indexes.push(index)
          indexes.push(triangleIndexes[i-2])
          break;
        default:
          break;
        }
      });
      return indexes;
    }

/**
 * Triangulate given points with Bowyer–Watson algorithm
 * @param {number[][]} points - array of points to be triangulated [[x1,y1],[x2,y2]...]
 * @returns {number[][][]} array of triangles [[[x1,y1], [x2,y2], [x3,y3]]...]
 * 
 */
function triangulate(points){
  //add super triangle which contains all the points
  let superTriangle = findSuperTriangle(points)
  let triangles = [superTriangle];
  
  //add points one by one
  points.forEach(point => {
    
    //find all the bad triangles
    let badTriangles = [];

    triangles.forEach(triangle => {
      if(isPointInsideCircumcircle(point, triangle)){
        badTriangles.push(triangle);
      }
    });

    //remove bad triangles from triangulation
    badTriangles.forEach(badTriangle => {
      triangles.forEach((triangle,i) => {     
        if(badTriangle.every((value,j) => value === triangle[j])){    
          delete triangles[i];
        }
      });
      triangles = triangles.filter(x => x !== undefined);
    });

    //find the boundary of the polygon
    let polygon = [];

    badTriangles.forEach(badTriangle => {
      let edges = [
        [badTriangle[0], badTriangle[1]],
        [badTriangle[1], badTriangle[2]],
        [badTriangle[0],badTriangle[2]]
      ]
 
      edges.forEach(edge => {
        if(!isEdgeShared(edge,badTriangles)){
          polygon.push(edge);
        }
      });
    });

    //re-triangulate the polygonal hole
    polygon.forEach(edge => triangles.push([...edge, point]));
  });

  //delete triangles which have superTriangle vertices
  triangles.forEach((triangle,index) => {
    if(containsVertexFromOriginal(triangle,superTriangle)){ 
      delete triangles[index];
    }
  });
 
  triangles = triangles.filter(x => x !== undefined);

  return triangles;
}

/**
 * Find triangle which contains all the given points
 * @param {number[][]} points - array of points [[x1,y1],[x2,y2]...]
 * @returns {number[][]} triangle which contain all the points [[x1,y1], [x2,y2], [x3,y3]]
 * 
 */
function findSuperTriangle(points) {
  let [minX,minY,maxX,maxY] = [Infinity,Infinity,-Infinity,-Infinity]

  points.forEach(point => {
    minX = Math.min(minX, point[0]);
		minY = Math.min(minX, point[1]);
		maxX = Math.max(maxX, point[0]);
		maxY = Math.max(maxX, point[1]);   
  });

 let width = maxX - minX;
 let height = maxY - minY;

 return [[minX-width, minY-height], [minX+width*10, minY-height], [minX-width, minY+height*10]];
}


//https://stackoverflow.com/questions/39984709/how-can-i-check-wether-a-point-is-inside-the-circumcircle-of-3-points
/**
 * Check if point is inside circumcircle
 * 
 * @param {number[]} point - point which will be checked if it is inside the circumcircle [x1,y1]
 * @param {number[][]} triangle - triangle for circumcircle [[x1,y1], [x2,y2], [x3,y3]]
 * 
 */
function isPointInsideCircumcircle(point, triangle){
  let [dx,dy] = point;
  let [ax,ay] = triangle[0];
  let [bx,by] = triangle[1];
  let [cx,cy] = triangle[2];

  let temp;

  if(!isCounterClockwise(ax, ay, bx, by, cx, cy)){
    temp = bx;
    bx = cx;
    cx = temp;

    temp = by;
    by = cy;
    cy = temp;
  } 

  let ax_ = ax-dx;
  let ay_ = ay-dy;
  let bx_ = bx-dx;
  let by_ = by-dy;
  let cx_ = cx-dx;
  let cy_ = cy-dy;

  return ((ax_*ax_ + ay_*ay_) * (bx_*cy_-cx_*by_) -(bx_*bx_ + by_*by_) * (ax_*cy_-cx_*ay_) +(cx_*cx_ + cy_*cy_) * (ax_*by_-bx_*ay_)) > 0;
}

function isCounterClockwise (ax, ay, bx, by, cx, cy) {
  return (bx - ax)*(cy - ay)-(cx - ax)*(by - ay) > 0;
}

/**
 * Check if given edge is shared between more than one triangle
 * 
 * @param {number[][]} edge - edge which will be checked [[x1,y1], [x2,y2]]
 * @param {number[][][]} badTriangles - list of  bad triangles which will be checked [[[x1,y1], [x2,y2], [x3,y3]]...]
 * 
 */
function isEdgeShared(edge,badTriangles){
  let count = 0;

  badTriangles.forEach(badTriangle => {
    let triangleEdges = [
      [badTriangle[0], badTriangle[1]],
      [badTriangle[1], badTriangle[2]],
      [badTriangle[0], badTriangle[2]]
    ]

    triangleEdges.forEach(triangleEdge => {
      if(edge[0][0] === triangleEdge[0][0] && edge[0][1] === triangleEdge[0][1] && edge[1][0] === triangleEdge[1][0] && edge[1][1] === triangleEdge[1][1]) count++;
      if(edge[1][0]  === triangleEdge[0][0] && edge[1][1] === triangleEdge[0][1] && edge[0][0] === triangleEdge[1][0] && edge[0][1] === triangleEdge[1][1]) count++;
    });
  });

  return count>1;
}

/**
 * check if given triangle contains vertex from given supertriangle
 * 
 * @param {number[][]} triangle [[x1,y1], [x2,y2], [x3,y3]]
 * @param {number[][]} superTriangle [[x1,y1], [x2,y2], [x3,y3]]
 * 
 */
function containsVertexFromOriginal(triangle, superTriangle){

  let result = false;

  superTriangle.forEach(point1 => {
    triangle.forEach(point2 => {
      if(point1[0] === point2[0] && point1[1] === point2[1]) result = true;
    });
  });

  return result;
}


