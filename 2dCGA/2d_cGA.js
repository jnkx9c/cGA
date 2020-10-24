
/**
 * The probability vector
 */
const p_v = [];

/**
 * The 'population' size.
 * since cga doesn't have a population, this
 * is used when updating the probability vector.
 * Larger values slow convergence, but helps climb out of local optimas.
 * Smaller values speed up convergence, but ga might/will get stuck in local optima.
 */
const N=100;



function generateWeights(c){
  var weights = []
  for(var i = 0; i<c; i++){
    r = Math.random();
    if ( r < 0.15){
      weights.push(20)
    }else if( r<.30){
      weights.push(15)
    }else if(r < 0.60){
      weights.push(10);
    }else{
      weights.push(5);
    }
  }
  console.debug(weights)
  return weights;
}


const container_count = 2**9;


// weights = [5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20];
/**
 * this contains the container weights.
 * Each location specifies the weight of a particular container.
 */
const weights = generateWeights(container_count)
//[5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20];
const weights_colors={5:'green',10:'yellow',15:'orange',20:'red'};
    // 5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20];



/**
 * This is the number of spaces that containers
 * can be stored in.  If multiple containers occupy
 * the same space, they will be 'stacked', and their
 * weights summed to provide a single weight for
 * a container location.
 * This value should be a power of 2
 */
const container_location_size = 32;



const max_height=container_count/container_location_size;
console.log(`max_height = ${max_height}`)
const max_height_penalty = 100

/**
 * The number of bits per gene.
 */
let g_len = Math.log2(container_location_size);


/**
 * L is the number of bits in the chromosome.
 * It is calculated using the container_location_size the number of containers (weights).
 * 
 * The number of bits needed for 1 container:
 * if container_location_size is 16, that requires 4 bits.
 * log2(container_location_size)*number of weights.
 * 
 */
 let L = g_len*container_count;

 let total_weight = weights.reduce((t,n)=>{return t+n;});


/**
 * this is the penalty assigned for each missing container in a solution.
 */
const missing_container_pen = -100;

/**
 * this is the penalty assigned for each duplicate container in a solution.
 */
const duplicate_container_pen = -200;



var paused = false;

/**
 * p5 setup function
 */
function setup() {
  createCanvas(displayWidth, 600);  
  for(i=0; i<L; i++){
   p_v.push(0.5); 
  }
  button = createButton('pause');
  button.position(10, 10);
  button.mousePressed(function(){
    paused = !paused
    console.log(`paused = ${paused}`)
    
    console.debug(this.elt)
    console.debug(this);
  });
  
}


/**
 * p5 draw function and vars
 */
// var draw_loc_vals;
var draw_left_wgt=-1;
var draw_right_wgt = -1;
var draw_fitness = 'nada';
var draw_pointer_ary;
var draw_missing_c_fit=0
var draw_duplicate_c_fit=0
var draw_balance_fit = 0;
var draw_height_fit = 0;
var draw_loc_vals;
var row_size = 15;
var draw_wgts = [];

var pvbar_w = 3



function draw() {
  background(51);
  if(!paused){
    doGa();
  

    if(frameCount%100 == 0){
      sample = sampleProbVector();
      draw_loc_vals = calc_loc_vector(sample);


      // draw_missing_c_fit = missing_container_fitness(draw_loc_vals);
      // draw_duplicate_c_fit = duplicate_container_fitness(draw_loc_vals);
      draw_balance_fit = balance_fitness(draw_loc_vals);
      draw_height_fit = fitness_container_heights(draw_loc_vals);
      draw_left_wgt = w.slice(0,container_location_size/2).reduce((t,n)=>{return t+n;});
      draw_right_wgt = w.slice(container_location_size/2,container_location_size).reduce((t,n)=>{return t+n;});
      draw_wgts = calc_weight_vector(draw_loc_vals);   
      draw_fitness = fitness(sample);
      
    }
  }
    fill(255, 255, 255);
    row = row_size + 30

    text('frameCount',10,row)
    text(frameCount, 100, row);  
    row+=row_size

    text('container_count',10,row)
    text(container_count,100,row)    
    row+=row_size

    text('max_height',10,row)
    text(max_height,100,row)    
    row+=row_size


    text('balance_fit',10,row)
    text(draw_balance_fit,100,row)    
    row+=row_size

    text('height_fit',10,row)
    text(draw_height_fit,100,row)    
    row+=row_size



    text('wgts',10,row)
    text(draw_wgts,100,row)    
    row+=row_size

    if(draw_wgts.length>0){

        text('weights sum',10,row)
        text(draw_wgts.reduce((t,n)=>{return t+n;}),100,row);
        row+=row_size

    }
    if(draw_loc_vals !== undefined){
        text('location vals',10,row)
        text(draw_loc_vals,100,row);
        row+=row_size

        var test_ary = Array(container_location_size).fill(0);
        for(var i=0; i<draw_loc_vals.length; i++){
            test_ary[draw_loc_vals[i]]=test_ary[draw_loc_vals[i]]+1;
        }
        
        
        
        
        
        //try to figure out how to stack the weights so they can be drawn.
          var wght2dAry = []
          for(var i=0; i<container_location_size; i++){
            wght2dAry.push([])
          }
          
          for(var i=0; i<draw_loc_vals.length; i++){
            con_loc = draw_loc_vals[i]
            wgtForLoc = weights[i]
            // print(`con_loc ${con_loc} has a wgt of ${wgtForLoc}`)
            if( wght2dAry[con_loc] == undefined){
              wght2dAry[con_loc] = []
            }
            // console.log(`pushing wft ${wgtForLoc} into con_loc ${con_loc}`)
            wght2dAry[con_loc].push(wgtForLoc)
          } 

          var con_w=15
          var con_h=10
          push()
          for(var i=0; i<container_location_size; i++){
            var y = 0;
            for(var j=0; j<wght2dAry[i].length; j++){
              fill(weights_colors[wght2dAry[i][j]])
              rect(200+i*con_w, 500-y, con_w, -con_h)
              y=y+con_h
            }
          }
          pop();

          push();
          stroke('red');
          line(200-10, 500-max_height*con_h, 200+10+wght2dAry.length*con_w, 500-max_height*con_h);
          pop();
          text('max height',200+20+wght2dAry.length*con_w, 500-max_height*con_h)
          /**
         * draw each location as a weighted retangle.
         * Each rectangle height should indicate how many containers are stacked.
         */
        push()
        textSize(8);
        
        for(var i1=0; i1<test_ary.length; i1++){
          // rect(200+i1*25, 400, 25, -(test_ary[i1]*5));
          text(test_ary[i1],(200+i1*con_w)+5,520)
          text(draw_wgts[i1],(200+i1*con_w)+5,540)
        }
        pop()
    }
  

    text(`fitness: ${draw_fitness}`,10,row);
    row+=row_size

    // text(p_v.map(x => x.toFixed(1)),10,row);
    



    //draw the prob vector rectangles
    for(var pv_i=0; pv_i<p_v.length; pv_i++){
        push();
        if(abs(p_v[pv_i]-1.0) < 0.0003 || abs(p_v[pv_i]) <0.0003 ){
            fill('green')
            // stroke('green')
        }
        rect(5+pv_i*pvbar_w, 220, pvbar_w, -p_v[pv_i]*50); 
        pop();
    }
  
  
  //draw the left and right weight rectangles.
  if(draw_left_wgt>=0){
    rect(30, 500, 50, -draw_left_wgt*(draw_left_wgt/(total_weight*8)));
    text(draw_left_wgt,30+20, 515);
  }

  if(draw_right_wgt>=0){
    rect(80, 500, 50, -draw_right_wgt*(draw_left_wgt/(total_weight*8)));
    text(draw_right_wgt,80+20, 515);
  }

}










/*******************************************************
 * 
 * start problem specific GA functions
 * 
 *******************************************************/


 /**
  * A utility function to convert a bit array to an integer.
  * @param {int[]} b_ary 
  */
function bitToInt(b_ary){
    var ret = 0;
    for(var i=0; i<b_ary.length; i++){
      ret = ret<<1;
      ret+=b_ary[i];
    }
    return ret;
  }


/**
 * Calculates a location array.
 * Given an individual (bit array), 
 * divide the individual up into chunks/genes and convert the genes to an integer.
 * Each integer will be a location in the weight vector.
 * Store each location in an array and return.
 * The returned array will be length of weights array
 * @param {int[]} indiv 
 */
function calc_loc_vector(indiv){
  var loc_v = Array(weights.length).fill(0);
  for(var i=0; i<weights.length; i++){
    g_loc = bitToInt(indiv.slice(i*g_len,(i*g_len)+g_len));
    loc_v[i]=g_loc;
  }
  return loc_v;
}


/**
 * calculates the weight of each space in the container locations.
 * ie, if container space 1 has 3 containers, each weighing 5, then 
 * container space 1 would weigh 15.
 * This is calculated using the location vector (ie, where each gene in the chromosome is pointing to)
 * @param {int[]} loc_v 
 */
function calc_weight_vector(loc_v){
  var w = Array(container_location_size).fill(0);
  for(var i=0; i<weights.length; i++){
    w[loc_v[i]]+=weights[i];
  }
  return w;
}



function fitness_container_heights(loc_v){
  fit = 0;

  var locations = new Array(container_location_size).fill(0);
  
  for(var i=0; i<loc_v.length; i++){
    locations[loc_v[i]]++
  }

  
  for(var i=0; i<loc_v.length; i++){
    if(locations[i]>max_height){
      fit+= -(max_height_penalty*(locations[i]-max_height))
    }
  }
  return fit
  
  //heres a fnc that rewards tall heights
  // return Math.max(...locations)*100

}


/**
 * Calculates a fitness score based on how well the containers are balanced.
 * Balanced means that the weight of the containers on the left side should be close 
 * to the weight of the containers on the right side.
 * @param {int[]} loc_v 
 */
function balance_fitness(loc_v){
    w = calc_weight_vector(loc_v);  
    left_wgt = w.slice(0,container_location_size/2).reduce((t,n)=>{return t+n;});
    right_wgt = w.slice(container_location_size/2,container_location_size).reduce((t,n)=>{return t+n;}); 
    wgt_diff = left_wgt-right_wgt;
    return -abs(wgt_diff);
}


/**
 * Given an individual chromosome, compute the fitness
 * @param {int[]} indiv 
 */
function fitness(indiv){

  loc_v = calc_loc_vector(indiv);
  // missing_c_fitness = missing_container_fitness(loc_v);
  // duplicate_c_fitness = duplicate_container_fitness(loc_v);
  bal_fitness = balance_fitness(loc_v);
  return (bal_fitness + fitness_container_heights(loc_v));
}




/**
 * This area begins the generic cGA functions.
 * 
 */

/**
 * Given 2 individuals, allow them to compete, and return the winner,loser in an array.
 * @param {int[]} player1 
 * @param {int[]} player2 
 */
function compete(player1, player2){
  ind1fit = fitness(player1)
  ind2fit = fitness(player2)

  if(ind1fit>ind2fit){
    return([player1,player2]);
  }else{
    return([player2,player1]);
  }
}





/**
 * Sample the probability vector.
 * Will return a bit array generated from the prob vectors
 */
function sampleProbVector(){
  sample = [];
  for(var i=0; i<L; i++){
    if(random()<p_v[i]){
      sample.push(1);
    }else{
      sample.push(0);
    }
  }
  return sample;
}


function doGa(){
    s1 = sampleProbVector();
    s2 = sampleProbVector();

    
    results = compete(s1,s2);
    winner = results[0];
    loser = results[1]

    for(var i=0; i<L; i++){
      if(winner[i] !== loser[i]){
        if(winner[i]===1){
          p_v[i]+=1/N;
        }else{
          p_v[i]-=1/N;
        }
      }
    }
}
