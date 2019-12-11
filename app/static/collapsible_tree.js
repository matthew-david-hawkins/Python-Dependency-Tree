// ------------------------------
// Application functions
//-------------------------------

// Make API call, draw diagram
function main(inputValue){

  loadingFunction(); // Show loading spinner

  url = "https://python-dependency-api.herokuapp.com/api/python/" + inputValue
  // url = "http://127.0.0.1:5000/api/python/" + inputValue

  d3.json(url).then(function(data){

    make_tree(data);

  }); // Load data in json form

}

function make_tree(data){
  console.log(data)
  treeData = data["dependency_tree"]
  summary = data.info.summary
  console.log(summary)
  d3.select("#module-description").selectAll("*").remove() // remove everything that's already there

  d3.select("#module-extras").selectAll("*").remove() // remove everything that's already there

  d3.select("#tree").selectAll("*").remove() // remove everything that's already there

  var mysvg = chart(treeData)

  d3.select("#tree").node().append(mysvg);

  d3.select("#module-description").insert("h4")
  .html(`<br>Summary: ${summary}`)//.style("color", "#1f77b4") // Plotly "muted blue"

  d3.select("#module-extras").insert("p")
  .html(`<br><br>Home: <a href="${data.home_page}" target="_blank"><strong>${data.home_page}</strong></a>
  <br><br>Latest Version: <strong>${data.latest_release}</strong>
  <br><br>Requires Python Version: <strong>${data.requires_python}</strong>
  `)// .style("color", "#1f77b4") // Plotly "muted blue"

  completionFunction(); // End loading spinner
}

// Select main on search click
setTimeout(function() { 

  var button = d3.select("#searchButton");

  button.on("click", function() {

  // Select the input element and get the raw HTML node
  var inputElement = d3.select("#theInput");

  // Get the value property of the input element
  var inputValue = inputElement.property("value");
  
  main(inputValue);

  });
  
}, 1000)

// call main on form submission
d3.select("#theForm").on("submit", function() {

  d3.event.preventDefault();

  var inp = d3.select("#theInput");

  var v = inp.property("value");

  inp.property("value", "");

  main(v)

  return false;
});

// Function for showing loading status
function loadingFunction() {
  console.log("loading")
  var x = document.getElementById("loadingButton");
  if (x.style.display === "none") {
    x.style.display = "block";
  }

  var y = document.getElementById("searchButton");
  if (y.style.display !== "none") {
    y.style.display = "none";
  }
}

// Function for hiding the loading status
function completionFunction() {
  console.log("loading")
  var x = document.getElementById("searchButton");
  if (x.style.display === "none") {
    x.style.display = "block";
  }

  var y = document.getElementById("loadingButton");
  if (y.style.display !== "none") {
    y.style.display = "none";
  }
}

//---------------------------
// Collapsible Tree
//---------------------------
var w = window.innerWidth;
var h = window.innerHeight;
margin = ({top: 10, right: 450, bottom: 10, left: 200}); // set margins

var width = w - margin.left - margin.right; // set chart width

// d3 = require("d3@5");

diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x); // horizontal links

dx = 15; // controls vertical spacing

dy = width / 6.5; // controls horizontal spacing

tree = d3.tree().nodeSize([dx, dy]); // Create a tree layout with node sizes specified as above

  
// // define tooltip parameters
//   var toolTip = d3.tip()
//   .attr("class", "tooltip")
//   .html(function(d) {
//       return (`testing<br>testing2: testing3<br>testing4: testing5`);
//   });

//   // define tooltip parameters
//   var toolTippointer = d3.tip()
//   .attr("class", "tooltippointer")
//   .html("")

// Tooltip function
function mouseover(d) {
  if (d._children){
  d3.select(this).append("text")
      .attr("class", "hover")
      .attr('transform', function(d){ 
          return 'translate(5, 2)';
      })
      .text("Click to expand");
  }
}

// Toggle children on click.
function mouseout(d) {
  d3.select(this).select("text.hover").remove();
}


// Draw collapisble tree with json data
function chart(data){

  const root = d3.hierarchy(data); // Create hierarchy objecy

  root.x0 = dy / 2;

  root.y0 = 0;

  root.descendants().forEach((d, i) => {
    console.log("depth:" + d.depth)
    d.id = i;
    d._children = d.children;
    if (d.depth && d.data.name.length !== 7) d.children = null;
  });

  const svg = d3.create("svg")
      .attr("viewBox", [-margin.left, -margin.top, width, dx]) 
      .style("font", "10px sans-serif")
      .style("user-select", "none");

  const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5);

  const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

  function update(source) {
    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    let left = root;
    let right = root;
    root.eachBefore(node => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + margin.top + margin.bottom;

    const transition = svg.transition()
        .duration(duration)
        .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
        .tween("resize", window.ResizeObserver ? null : () => () => svg.dispatch("toggle"));

    // Update the nodes…
    const node = gNode.selectAll("g")
      .data(nodes, d => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", d => {
          d.children = d.children ? null : d._children;
          update(d);
        });
        // .on("mouseover", mouseover);
        //.on("mouseout", mouseout);

    // Append a "click here for first exapandable node"
//     nodeEnter.append("text")
//   if (d._children){
//   d3.select(this).append("text")
//       .attr("class", "hover")
//       .attr('transform', function(d){ 
//           return 'translate(5, 2)';
//       })
//       .text("Click to expand");
//   }
// }

    nodeEnter.append("circle")
        .attr("r", 2.5)
        .attr("fill", d => d._children ? "#0000EE" : "#999") // if it has dependents show in hyperlink blue, otherwise gray
        .attr("stroke-width", 10);

    nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d._children ? -6 : 6)
        .attr("text-anchor", d => d._children ? "end" : "start")
        .text(d => d.data.name)
      .clone(true).lower()
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white")



    // Transition nodes to their new position.
    const nodeUpdate = node.merge(nodeEnter).transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path")
      .data(links, d => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().append("path")
        .attr("d", d => {
          const o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition(transition).remove()
        .attr("d", d => {
          const o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        });

    // Stash the old positions for transition.
    root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
    
    // // bind tooltips
    // nodeEnter.call(toolTip);
    // nodeEnter.call(toolTippointer);

    // // show tooltip on mouseover the text within the marker
    // nodeEnter.on("mouseover", function(data) {
    //   toolTip.show(data, this);
    //   toolTippointer.show();
    //   })
  
    // // hide tooltip on mouseout of the circle
    // nodeEnter.on("mouseout", function(data) {
    //     toolTip.hide(data, this);
    //     toolTippointer.hide();
    // })
  }

  update(root);

  return svg.node();
} 

// initaialize with data from the 'tensorflow' module
example = {
    "dependency_tree": {
      "children": [
        {
          "name": "absl-py"
        }, 
        {
          "name": "astor"
        }, 
        {
          "name": "backports.weakref"
        }, 
        {
          "name": "enum34"
        }, 
        {
          "name": "functools32"
        }, 
        {
          "name": "gast"
        }, 
        {
          "children": [
            {
              "name": "six"
            }
          ], 
          "name": "google-pasta"
        }, 
        {
          "children": [
            {
              "name": "enum34"
            }, 
            {
              "name": "futures"
            }, 
            {
              "name": "six"
            }
          ], 
          "name": "grpcio"
        }, 
        {
          "children": [
            {
              "name": "h5py"
            }, 
            {
              "name": "numpy"
            }
          ], 
          "name": "keras-applications"
        }, 
        {
          "children": [
            {
              "name": "numpy"
            }, 
            {
              "name": "six"
            }
          ], 
          "name": "keras-preprocessing"
        }, 
        {
          "children": [
            {
              "name": "funcsigs"
            }, 
            {
              "name": "six"
            }
          ], 
          "name": "mock"
        }, 
        {
          "name": "numpy"
        }, 
        {
          "name": "opt-einsum"
        }, 
        {
          "children": [
            {
              "name": "setuptools"
            }, 
            {
              "name": "six"
            }
          ], 
          "name": "protobuf"
        }, 
        {
          "name": "six"
        }, 
        {
          "children": [
            {
              "name": "absl-py"
            }, 
            {
              "name": "futures"
            }, 
            {
              "children": [
                {
                  "name": "cachetools"
                }, 
                {
                  "children": [
                    {
                      "name": "pyasn1"
                    }
                  ], 
                  "name": "pyasn1-modules"
                }, 
                {
                  "name": "rsa"
                }, 
                {
                  "name": "setuptools"
                }, 
                {
                  "name": "six"
                }
              ], 
              "name": "google-auth"
            }, 
            {
              "children": [
                {
                  "children": [
                    {
                      "name": "cachetools"
                    }, 
                    {
                      "children": [
                        {
                          "name": "pyasn1"
                        }
                      ], 
                      "name": "pyasn1-modules"
                    }, 
                    {
                      "name": "rsa"
                    }, 
                    {
                      "name": "setuptools"
                    }, 
                    {
                      "name": "six"
                    }
                  ], 
                  "name": "google-auth"
                }, 
                {
                  "name": "requests-oauthlib"
                }
              ], 
              "name": "google-auth-oauthlib"
            }, 
            {
              "children": [
                {
                  "name": "enum34"
                }, 
                {
                  "name": "futures"
                }, 
                {
                  "name": "six"
                }
              ], 
              "name": "grpcio"
            }, 
            {
              "children": [
                {
                  "name": "setuptools"
                }
              ], 
              "name": "markdown"
            }, 
            {
              "name": "numpy"
            }, 
            {
              "children": [
                {
                  "name": "setuptools"
                }, 
                {
                  "name": "six"
                }
              ], 
              "name": "protobuf"
            }, 
            {
              "children": [
                {
                  "name": "certifi"
                }, 
                {
                  "name": "chardet"
                }, 
                {
                  "name": "idna"
                }, 
                {
                  "name": "urllib3"
                }
              ], 
              "name": "requests"
            }, 
            {
              "name": "setuptools"
            }, 
            {
              "name": "six"
            }, 
            {
              "name": "werkzeug"
            }, 
            {
              "name": "wheel"
            }
          ], 
          "name": "tensorboard"
        }, 
        {
          "name": "tensorflow-estimator"
        }, 
        {
          "name": "termcolor"
        }, 
        {
          "name": "wheel"
        }, 
        {
          "name": "wrapt"
        }
      ], 
      "name": "tensorflow"
    }, 
    "download_sizes": [
      {
        "date": "2019-09-30T17:23:22", 
        "packagetype": "bdist_wheel", 
        "size": 102727834
      }, 
      {
        "date": "2019-09-30T17:23:34", 
        "packagetype": "bdist_wheel", 
        "size": 86339228
      }, 
      {
        "date": "2019-09-30T17:23:45", 
        "packagetype": "bdist_wheel", 
        "size": 102703690
      }, 
      {
        "date": "2019-09-30T17:23:56", 
        "packagetype": "bdist_wheel", 
        "size": 86326766
      }, 
      {
        "date": "2019-09-30T17:24:05", 
        "packagetype": "bdist_wheel", 
        "size": 48074995
      }, 
      {
        "date": "2019-09-30T17:24:15", 
        "packagetype": "bdist_wheel", 
        "size": 102703862
      }, 
      {
        "date": "2019-09-30T17:24:27", 
        "packagetype": "bdist_wheel", 
        "size": 86330593
      }, 
      {
        "date": "2019-09-30T17:24:35", 
        "packagetype": "bdist_wheel", 
        "size": 48073858
      }, 
      {
        "date": "2019-09-30T17:24:46", 
        "packagetype": "bdist_wheel", 
        "size": 102703897
      }, 
      {
        "date": "2019-09-30T17:24:58", 
        "packagetype": "bdist_wheel", 
        "size": 86326709
      }, 
      {
        "date": "2019-09-30T17:25:06", 
        "packagetype": "bdist_wheel", 
        "size": 48074378
      }
    ], 
    "home_page": "https://www.tensorflow.org/", 
    "info": {
      "requiresdist": [
        {
          "name": "absl-py", 
          "version": "(>=0.7.0)"
        }, 
        {
          "name": "astor", 
          "version": "(>=0.6.0)"
        }, 
        {
          "name": "gast", 
          "version": "(==0.2.2)"
        }, 
        {
          "name": "google-pasta", 
          "version": "(>=0.1.6)"
        }, 
        {
          "name": "keras-applications", 
          "version": "(>=1.0.8)"
        }, 
        {
          "name": "keras-preprocessing", 
          "version": "(>=1.0.5)"
        }, 
        {
          "name": "numpy", 
          "version": "(<2.0,>=1.16.0)"
        }, 
        {
          "name": "opt-einsum", 
          "version": "(>=2.3.2)"
        }, 
        {
          "name": "six", 
          "version": "(>=1.10.0)"
        }, 
        {
          "name": "protobuf", 
          "version": "(>=3.6.1)"
        }, 
        {
          "name": "tensorboard", 
          "version": "(<2.1.0,>=2.0.0)"
        }, 
        {
          "name": "tensorflow-estimator", 
          "version": "(<2.1.0,>=2.0.0)"
        }, 
        {
          "name": "termcolor", 
          "version": "(>=1.1.0)"
        }, 
        {
          "name": "wrapt", 
          "version": "(>=1.11.1)"
        }, 
        {
          "name": "grpcio", 
          "version": "(>=1.8.6)"
        }, 
        {
          "name": "wheel"
        }, 
        {
          "name": "mock", 
          "version": "(>=2.0.0)"
        }, 
        {
          "name": "functools32", 
          "version": "(>=3.2.3)"
        }, 
        {
          "extras": " python_version < \"3.4\"", 
          "name": "backports.weakref", 
          "version": "(>=1.0rc1)"
        }, 
        {
          "extras": " python_version < \"3.4\"", 
          "name": "enum34", 
          "version": "(>=1.1.6)"
        }
      ], 
      "summary": "TensorFlow is an open source machine learning framework for everyone."
    }, 
    "latest_release": "2.0.0", 
    "name": "tensorflow", 
    "requires_python": ""
  }

// initialize page with data
make_tree(example);





