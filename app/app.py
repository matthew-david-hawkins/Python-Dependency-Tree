################################################
# Overview

################################################
from flask import Flask, jsonify, render_template
from typing import Dict, List
from pprint import pprint

#Connect to Mongo DB Atlas
import pymongo

deployment = "mongodb+srv://thrum-rw:Skipshot1@thrumcluster-f2hkj.mongodb.net/test?retryWrites=true&w=majority"
testing = "mongodb://localhost:27017/myDatabase"

client = pymongo.MongoClient(deployment)

# Define the database name to use
db = client.dependencytrees

# Define the collection to use
collection = db['python']

# serverStatusResult=db.command("serverStatus")
# if serverStatusResult:
#     print("""
# Connection to MongoDB was successful
#     """)
print("The following collections are available: ", db.list_collection_names())


app = Flask(__name__)

def get_module(module_name: str):
    """Takes a python module name, returns a Pymongo Query result"""
    try:
        
        base_module_object = collection.find({"name": module_name}, {'_id': False}) # do not return document Id, as this is not serializable
    
        base_module = base_module_object[0]

        return base_module
    
    except:
        
        print(f"No module with name: {module_name} found in database")


def children_list(module_name) -> Dict:
    """Takes a module name a returns a list in the form childen: <list of objects>}"""
    module_record = get_module(module_name)

    try:

        if module_record["info"]["requiresdist"]:
            
            children = []
            required_modules = module_record["info"]["requiresdist"]

            for module in required_modules:
                #print(module['extras'].strip(' '))
                try:
                    if module['extras'].replace(' ', "").find("extra==") == -1:
                        children.append(module["name"]) # only get modules without the designator 'extra ==' in the Extras
                except:
                    children.append(module["name"]) # if extras don't exist append it
            
            children = sorted(list(set(children)), key=str.casefold) # remove duplicates and sort alphabetically

            return children 
    
    except:
        
        pass

def get_description(module_name) -> Dict:
    """Takes a module name a returns a the module summary"""
    module_record = get_module(module_name)

    try:

        if module_record["info"]["summary"]:

            return module_record["info"]["summary"]
        
        else:

            return ""
    
    except:
        
        return ""

def dependency_tree(module: str, root: str, tree: Dict = {}, parent_list: List = [], recursion_depth: int = 0) -> Dict:
    """Takes a module name and does a recursive search for each module and returns a tree object"""
     # I would write the name of module
    tree.update({"name": module})

    description = get_description(module)

    tree.update({"summary": description})

    parent_list.append(module)

    children = children_list(module)

    if children: # I would check if the module had children

        # if it did have children, I would update the dictionary with a list {name: <module_name>, children = []}
        
        tree.update({"children": [{"name": child} for child in children]})
        # I would start a dictionary [{name: <first_child_name>}

        # then, for each child i would check if that module had a dependency
        for i in range(len(children)):
            this_dict = tree["children"][i]
            this_child = this_dict["name"]
            # print(f"{this_child}: {parent_list}")
            if this_child in parent_list: # a child cannot depend on any of its parents, so check if this children is found in the list of parents
                print(f"this module is already found on this branch -> interdependcy found for module: {this_child}")
                # print(parent_list, "\n\n")
            else:
                # if recursion_depth == 0:
                #     # print(this_child)
                if recursion_depth < 5:   
                    recursion_depth += 1
                    dependency_tree(this_child, root, this_dict, parent_list, recursion_depth)
                    recursion_depth -= 1
                
    else: # If it didn't I would write down name: {name: <module_name>} and be done
        tree.update({"name": module})
    
    
    del parent_list[-1]
    return tree


@app.route("/")
def home():

    return render_template("index.html")


@app.route("/api/python/<module>")
def historical(module: str):
    """Takes a python module name and returns full dependency tree"""
    name = module.lower()
    record = get_module(name)
    try:

        tree = record["dependency_tree"]
        response = jsonify(record)
        response.headers.add('Access-Control-Allow-Origin', '*')
        print("quick")
        print(response)

    except:
        print("slow")
        try:
            tree = dependency_tree(name, name, {}, [], 0)
            print(tree)
            print(record)
            collection.find_one_and_update({"name": name}, 
                        {"$set": 
                            {"dependency_tree": tree}
                                })
            new_record = get_module(name)
            response = jsonify(new_record)
            response.headers.add('Access-Control-Allow-Origin', '*')
            print(response)
        except:
            response = {}

    return response

if __name__ == '__main__':
    
    app.run(debug=True)
