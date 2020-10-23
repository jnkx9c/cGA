
/**
 * The probability vector
 */
p_v = [];

/**
 * The 'population' size.
 * since cga doesn't have a population, this
 * is used when updating the probability vector.
 * Larger values slow convergence, but helps climb out of local optimas.
 * Smaller values speed up convergence, but ga might/will get stuck in local optima.
 */
N=500;


// weights = [5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20];
/**
 * this contains the container weights.
 * Each location specifies the weight of a particular container.
 */
weights = [5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20]
    
    // 5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20];

/**
 * This is the number of spaces that containers
 * can be stored in.  If multiple containers occupy
 * the same space, they will be 'stacked', and their
 * weights summed to provide a single weight for
 * a container location.
 * This value should be a power of 2
 */
let container_location_size = 16;

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
 let L = g_len*weights.length;

 let total_weight = weights.reduce((t,n)=>{return t+n;});


/**
 * this is the penalty assigned for each missing container in a solution.
 */
const missing_container_pen = -100;

/**
 * this is the penalty assigned for each duplicate container in a solution.
 */
const duplicate_container_pen = -200;
var draw_wgts = [];



function generateWeights(){
  
}

/**
 * p5 setup function
 */
function setup() {
  createCanvas(displayWidth, 500);  
  for(i=0; i<L; i++){
   p_v.push(0.5); 
  }
  
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
var draw_loc_vals;

function draw() {
  background(51);
  doGa();

  if(frameCount%100 == 0){
    //print(p_v);
    sample = sampleProbVector();

    // draw_pointer_ary = calc_container_pointers(sample);

    draw_loc_vals = calc_loc_vector(sample);
    print('loc_v=',draw_loc_vals);
    draw_missing_c_fit = missing_container_fitness(draw_loc_vals);
    draw_duplicate_c_fit = duplicate_container_fitness(draw_loc_vals);
    draw_balance_fit = balance_fitness(draw_loc_vals);
    // print(loc_fitness);
    draw_left_wgt = w.slice(0,container_location_size/2).reduce((t,n)=>{return t+n;});
    draw_right_wgt = w.slice(container_location_size/2,container_location_size).reduce((t,n)=>{return t+n;});
    print(`w = ${w}`)
    
    
    draw_wgts = calc_weight_vector(draw_loc_vals);   
    
    draw_fitness = fitness(sample);
    
    //text([left_wgt,right_wgt,left_wgt+right_wgt],10,70);
  }
  
    //text(frameCount);
    fill(255, 255, 255);


    text('missing_c_fit',10,15)
    text(draw_missing_c_fit,100,15)

    text('duplic_c_fit',10,30)
    text(draw_duplicate_c_fit,100,30)
    
    text('balance_fit',10,45)
    text(draw_balance_fit,100,45)    


    text(frameCount, 10, 60);  



    if(draw_wgts.length>0){
        text('draw_wgts',10,70)
        text(draw_wgts,100,70);
        
        text('draw_wgts sum',10,80)
        text(draw_wgts.reduce((t,n)=>{return t+n;}),100,80);
    }
    if(draw_loc_vals !== undefined){
        text('draw_loc_vals',10,95)
        text(draw_loc_vals,100,95);

        var test_ary = Array(container_location_size).fill(0);
        for(var i=0; i<draw_loc_vals.length; i++){
            test_ary[draw_loc_vals[i]]=test_ary[draw_loc_vals[i]]+1;
        }
        
        for(var i1=0; i1<test_ary.length; i1++){
            rect(200+i1*25, 400, 25, -(test_ary[i1]*5));
            text(test_ary[i1],(200+i1*25)+5,420)
            text(draw_wgts[i1],(200+i1*25)+5,440)
        }

    }
  
    text('l wgt, r wgt = ',10,110)
    text(draw_left_wgt,100,110);
    text(draw_right_wgt,150,110);
    
    text(`fitness: ${draw_fitness}`,10,125);
    text(p_v.map(x => x.toFixed(1)),10,140);
    
    //draw the prob vector rectangles
    for(var pv_i=0; pv_i<p_v.length; pv_i++){
        push();
        if(abs(p_v[pv_i]-1.0) < 0.0003 || abs(p_v[pv_i]) <0.0003 ){
            fill('green')
            stroke('green')
        }
        rect(pv_i*10, 200, 10, -p_v[pv_i]*50); 
        pop();
    }
  
  
  //draw the left and right weight rectangles.
  //someout need to scale this down; they get too tall
  if(draw_left_wgt>=0){
    rect(30, 400, 50, -draw_left_wgt*(draw_left_wgt/(total_weight*2)));
    text(draw_left_wgt,30+20, 415);
  }

  if(draw_right_wgt>=0){
    rect(80, 400, 50, -draw_right_wgt*(draw_left_wgt/(total_weight*2)));
    text(draw_right_wgt,80+20, 415);
  }

  
}


/*******************************************************
 * 
 * start GA functions
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
    w[loc_v[i]]+=weights[loc_v[i]];
  }
  return w;
}



/**
 *      SUBPROBLEM fitness
 * Calculates a fitness based on the location vector.
 * Basically, it checks to ensure that all containers 
 * are present in the solution.
 * If any containers are missing, a penalty is added (per missing container).
 * The larger the penalty is, the faster the GA will work to solve this subproblem first.
 * @param {int[]} loc_v 
 */
function missing_container_fitness(loc_v){
    var test_ary = Array(container_location_size).fill(0);

    for(var i=0; i<loc_v.length; i++){
      test_ary[loc_v[i]]=test_ary[loc_v[i]]+1;
    }
    //print('test_ary = ',test_ary);
    var fitness = 0;
    for(var j=0; j<test_ary.length; j++){
      if(test_ary[j]==0){
        fitness += missing_container_pen;
      }
    }
    return fitness;
}

/**
 * checks if there are any duplicate containers
 * in the solution.  
 * @param {int[]} loc_v 
 */
function duplicate_container_fitness(loc_v){
    var test_ary = Array(container_location_size).fill(0);
    
    for(var i=0; i<loc_v.length; i++){
        test_ary[loc_v[i]]=test_ary[loc_v[i]]+1;
      }
      //print('test_ary = ',test_ary);
      var fitness = 0;
      for(var j=0; j<test_ary.length; j++){
        if(test_ary[j]>1){
          fitness += duplicate_container_pen;
        }
      }
    return fitness;
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


function fitness(indiv){

    loc_v = calc_loc_vector(indiv);
    missing_c_fitness = missing_container_fitness(loc_v);
    duplicate_c_fitness = duplicate_container_fitness(loc_v);
    bal_fitness = balance_fitness(loc_v);
    return (bal_fitness+missing_c_fitness+duplicate_c_fitness);
}

function doGa(){
    s1 = sampleProbVector();
    s2 = sampleProbVector();
    

    
    fit1 = fitness(s1);
    fit2 = fitness(s2);
    //print(fit1);
    //print(fit2);    
    
    if(fit1>fit2){
      winner = s1;
      loser = s2;
    }else{
      winner = s2;
      loser = s1;
    }
    
    //print(winner);
    //print(loser);
    
    for(var i=0; i<L; i++){
      //print(winner[i], loser[i], winner[i] !== loser[i]);
      if(winner[i] !== loser[i]){
        if(winner[i]===1){
          p_v[i]+=1/N;
        }else{
          p_v[i]-=1/N;
        }
      }
      //print(p_v[i]);
    }
}
