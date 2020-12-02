
const prob_vector = [];

const ship_width = 2**4; //should be a power of 2. will need lg(ship_width) bits in the x component of the gene
const ship_length = 2**7; //should be a power of 2.  will need lg(ship_length) bits in the y component of the gene
const max_height = 8
const gene_x_len = Math.log2(ship_width)
const gene_y_len = Math.log2(ship_length)

const gene_len = Math.log2(ship_width) + Math.log2(ship_length);  //each gene will have an X and Y component
// const gene_count=8
const container_w = 10;
const container_h = 10;
const container_d = 10;
const container_count = 16000;//2**7  //doesn't neccisarily? need to be a power of 2

let generation = 0;


const weights = generateContainers(container_count); //this should be renamed to containers... but oh well.
//[5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20,5,10,5,15,5,20,15,10,5,15,20,20,5,15,5,20];
const weights_colors={5:'green',10:'yellow',15:'orange',20:'red'};

const L = gene_len*container_count;
const N=100;



var sample_chromosome;
var sample_location_vector=[];
var sample_balance_fitness=0;
var sample_height_fitness =0;
var convergence = 0;
var converged_bits = 0;
var converged = false;
var render_containers = true;
var render_prob_vector = false;

var html_fitness_balance;
var html_fitness_height;
var html_convergence;
var html_converged_bits;
var html_converged;
var html_container_count;
var html_ship_width;
var html_ship_length;
var html_max_height;




const s = ( sketch ) => {

    sketch.setup = () => {
        var canvas = sketch.createCanvas(800,600, sketch.WEBGL);
        for(i=0; i<L; i++){
            prob_vector.push(0.5); 
        }
        sketch.frameRate(90)
        sketch.select("#total_bits").html(prob_vector.length);
        html_fitness_balance = sketch.select('#fitness_balance');
        html_fitness_height = sketch.select('#fitness_height');
        html_convergence = sketch.select('#convergence');
        html_converged_bits = sketch.select('#converged_bits')
        html_converged = sketch.select('#converged')
        html_container_count = sketch.select("#container_count");
        html_ship_width = sketch.select("#ship_width")
        html_ship_length = sketch.select("#ship_length");
        html_max_height = sketch.select("#max_height");

        html_container_count.html(container_count);
        html_ship_width.html(ship_width);
        html_ship_length.html(ship_length);
        html_max_height.html(max_height);

    }
    
    sketch.draw = () => {
        sketch.background(51);
        sketch.orbitControl();
        sketch.select('#generation').html(generation)
        sketch.select('#frame_rate').html(sketch.round(sketch.frameRate()))

        
        if(!converged){
           doGaGeneration();
        }
        if(sketch.frameCount%10==0){
            if(!converged){
                sample_chromosome = sample();
            }
            if(!converged){
                calculate_convergence(sketch);                

            }                
            sample_location_vector = calc_loc_vector(sample_chromosome);
            sample_balance_fitness = fitness_balance(sample_location_vector);
            sample_height_fitness = fitness_height(sample_location_vector);
            if(sample_balance_fitness + sample_height_fitness == 0){
                converged=true
            }
            
            html_fitness_balance.html(sample_balance_fitness);
            html_fitness_height.html(sample_height_fitness);
            html_convergence.html(convergence);
            html_converged_bits.html(converged_bits);
            html_converged.html(converged);


        }
    
        if(render_containers === true){

            for(var i=0; i<sample_location_vector.length; i++){
                sketch.push();
                loc = sample_location_vector[i];
                sketch.fill(weights_colors[loc[3]]);
                
                //x,y,z
                sketch.translate(loc[0]*container_w,  -loc[2]*container_h-container_h/2,  loc[1]*container_d);
                sketch.strokeWeight(1);
                sketch.box(container_w,container_h, container_d);
                sketch.pop();        
            }
            sketch.push();
            sketch.fill('rgba(255,255,255,.25)');
            // sketch.fill('white')
            // sketch.box(ship_width*container_w, ship_length*container_d, max_height*container_h)
            // sketch.box( ship_length*container_d,ship_width*container_w, max_height*container_h)
            // sketch.box( ship_length*container_d, max_height*container_h,ship_width*container_w)
            sketch.translate((ship_width*container_w/2)-container_w/2,  -max_height*container_h/2,  (ship_length*container_d/2)-container_d/2);
            sketch.box(ship_width*container_w+1,  max_height*container_h+1,ship_length*container_d+1)
            sketch.pop();            
        }

    
    }
}

let myp5 = new p5(s, 'sketch-holder');

function calculate_convergence(sketch){
    var c_bits = 0;
    for(var i=0; i<prob_vector.length; i++){
        if(prob_vector[i]>.9998){
            prob_vector[i]=1.0
            c_bits++;
        }else if(prob_vector[i] <.0002){
            prob_vector[i]==0.0
            c_bits++;
        }
    }
    converged_bits = c_bits;
    converged=(converged_bits === prob_vector.length);
    convergence = ((c_bits/prob_vector.length)*100).toFixed(2);
    
}




/**
 * The sketch for the statistics
 * @param {} sketch 
 */

const stats_population_val_per_row = ship_width*gene_len
const stats_population_val_height = 20
const stats_population_val_width=3;
// const stats_population_dis_between_cols = 10;
const stats_population_dis_between_rows = stats_population_val_height+5;


const stats = ( sketch ) => {

    sketch.setup = () => {
        var canvas = sketch.createCanvas(800,ship_length*(stats_population_val_height+stats_population_dis_between_rows) +10*ship_length);
    }
    
    sketch.draw = () => {
        sketch.background(51);
        draw_population_vector(sketch);
    }
}

let stats_p5 = new p5(stats, 'stats_sketch-holder');

function toggleRenderProbVector(){
    render_prob_vector =! render_prob_vector;
}

function draw_population_vector(sketch){
    
    if(render_prob_vector === true){
        if(prob_vector !== undefined){
            // console.log(prob_vector);
            for(var i=0; i<prob_vector.length; i++){
                var x = 20+(i%stats_population_val_per_row)*stats_population_val_width
                var y = stats_population_val_height+ 5 + Math.floor(i/stats_population_val_per_row)*stats_population_dis_between_rows
                var w = stats_population_val_width
                var h = -prob_vector[i]*stats_population_val_height
                sketch.push();
                if(prob_vector[i] >=.9998 || prob_vector[i] <= .0003){
                    sketch.fill('green')
                }
                sketch.rect(x,y,w,h);
                sketch.pop();
            }
        }
    }    
}


function draw_fitness_scores(sketch){

}




function generateContainers(c){
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
  
  


/**
 * convert the chromosome into a location grid.
 * The chromosome can be divided in multiple X,Y pairs.
 * Returns an array of arrays/tuples...  [[X0,Y0,Weight0],[X1,Y1,Weight1],...]
 * @param {*} indiv 
 */
function calc_loc_vector(indiv){
    var loc_v = Array(weights.length).fill(0);
    var height_dict = {}
    for(var i=0; i<weights.length; i++){
        var x_start = i * gene_len
        var x_end = x_start + gene_x_len
        var y_start = x_end + 1
        var y_end = y_start + gene_y_len

        var g_loc_x_bin = indiv.slice(x_start,x_end);
        var g_loc_y_bin = indiv.slice(y_start,y_end);

        var g_loc_x_dec = bitToInt(g_loc_x_bin);
        var g_loc_y_dec = bitToInt(g_loc_y_bin);
        if(height_dict[[g_loc_x_bin,g_loc_y_dec]] === undefined){
            height_dict[[g_loc_x_bin,g_loc_y_dec]]=0;
        }else{
            height_dict[[g_loc_x_bin,g_loc_y_dec]]++;
        }
        // console.log( height_dict[[g_loc_x_bin,g_loc_y_dec]])
        // console.log(`i=${i} x_start = ${x_start} x_end = ${x_end} y_start = ${y_start} y_end=${y_end} g_loc_x_bin=${g_loc_x_bin} g_loc_y_bin=${g_loc_y_bin} g_loc_x_dec=${g_loc_x_dec} g_loc_y_dec=${g_loc_y_dec}`);


        loc_v[i]=[g_loc_x_dec,g_loc_y_dec,height_dict[[g_loc_x_bin,g_loc_y_dec]],weights[i]];
    }
    return loc_v;
}


function fitness_balance(loc_v){
    var left_weight = 0;
    var right_weight = 0;

    for(var i=0; i<loc_v.length; i++){
        x = loc_v[i][0]
        weight = loc_v[i][3]
        if(x<ship_width/2){
            left_weight+=weight;
        }else{
            right_weight+=weight;
        }
    }
    return -Math.abs(left_weight-right_weight)
}

function fitness_height(loc_v){
    
    var fit = 0;
    for(var i=0; i<loc_v.length; i++){
        if(loc_v[i][2]>(max_height-1)){  //the height is 0-indexed...  
            fit -= (loc_v[i][2]-(max_height-1))*100
        }
    
    }

    // var location_dict = {};
    // for(var i=0; i<loc_v.length; i++){
    //     if(location_dict[loc_v[i]]===undefined){
    //         location_dict[loc_v[i]] = 1
    //     }else{
    //         location_dict[loc_v[i]]++;
    //         if(location_dict[loc_v[i]]>8){
    //             //every container > 8, a penalty of 100 is applied per container
    //             fit -= (location_dict[loc_v[i]]-8)*100
    //         }
    //     }
        
        
    //   }
    //   console.log(location_dict);
      return fit;
  }

function bitToInt(b_ary){
    var ret = 0;
    for(var i=0; i<b_ary.length; i++){
      ret = ret<<1;
      ret+=b_ary[i];
    }
    return ret;
  } 


function fitness(individual){
    location_vector = calc_loc_vector(individual);
    fit_bal = fitness_balance(location_vector)
    fit_height = fitness_height(location_vector);
    return fit_bal+fit_height;   
}





/**
 * Given 2 individuals, allow them to compete, and return the winner,loser in an array.
 * @param {int[]} player1 
 * @param {int[]} player2 
 */
function compete(player1, player2){
    ind1fit = fitness(player1)
    ind2fit = fitness(player2)
  
    if(ind1fit>ind2fit){
      return([player1,ind1fit,player2,ind2fit]);
    }else{
      return([player2,ind2fit,player1,ind1fit]);
    }
  }




function sample(){
    smple = [];
    for(var i=0; i<L; i++){
      if(Math.random()<prob_vector[i]){
        smple.push(1);
      }else{
        smple.push(0);
      }
    }
    return smple;
  }


function hillclimber(individual){
    var fit = fitness(individual);
    console.log('hillclimber starting:  fit = '+fit);
    for(var i=0; i<individual.length; i++){
        var bit = individual[i]
        if(bit==0){
            individual[i]=1;
        }else{
            individual[i]=0;
        }
        new_fit = fitness(individual);
        if(new_fit < fit){
            individual[i] = bit;
        }else{
            fit = new_fit
        }
    }
    console.log('hillclimber finished:  fit = '+fit);
    return [individual,fit];
}


function doGaGeneration(){
    var s1 = sample();
    var s2 = sample();

    // s1 = hillclimber(s1)[0];
    // s2 = hillclimber(s2)[0];

    // s1 = hillclimber(s1)[0];
    var results = compete(s1,s2);
    var winner = results[0];
    var winner_fit = results[1];
    var loser = results[2];
    var loser_fit = results[3];


    //can a cga use a hill climber on the winner?
    //since we are updating the probailites based on the winner and loser bits.
    // if(winner_fit<0){
    //     hc_results = hillclimber(winner);
    //     winner = hc_results[0];
    //     winner_fit = hc_results[1];
    // }

    for(var i=0; i<L; i++){
        if(winner[i] !== loser[i]){
          if(winner[i]===1){
            prob_vector[i]+=1/N;
          }else{
            prob_vector[i]-=1/N;
          }
        }
    } 
    generation++;   
}


