import React, { useState, useEffect } from "react";
import { AppBar, Toolbar, IconButton, Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useNodesState, useEdgesState, addEdge } from "react-flow-renderer";
import Sidebar from "./components/sidebar";
import FlowArea from "./components/flow-area";
import DialogBox from "./components/node-dialog";
import initialNodes from "./data/initialNodes";
import initialEdges from "./data/initialEdges";
import circuitLibrary from "./data/circuitLibrary";
import RectangleNode from "./node-style/rectangleNode";
import CircleNode from "./node-style/circleNode";
import SquareNode from "./node-style/squareNode";

const DiagramTool = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [properties, setProperties] = useState([]);
  const [color, setColor] = useState("#000000");
  const [shapeType, setShapeType] = useState("rectangle");
  const [shouldClearCanvas, setShouldClearCanvas] = useState(false);
  const [isComponent, setIsComponent] = useState(true);
  const [previousNames, setPreviousNames] = useState([]);

  const [canvasNodes, setCanvasNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodesList, setNodesList] = useState([]);
  const [library, setLibrary] = useState(circuitLibrary);

  useEffect(
    () => {
      setCanvasNodes(initialNodes);
      setNodesList(initialNodes);
      setEdges(initialEdges);
    },
    [setCanvasNodes, setEdges]
  );

  const handleCreateComponent = () => {
    setIsComponent(true);
    setShouldClearCanvas(true);
    setName("");
    setProperties([]);
    setCanvasNodes([]);
    setEdges([]);
    // setOpen(true);
  };

  const handleCreateNode = () => {
    setIsComponent(false);
    setName("");
    setProperties([]);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = () => {
    if (name.trim() === "" || properties.length === 0) return;

    const nodeTypeMap = {
      rectangle: "rectangleNode",
      circle: "circleNode",
      square: "squareNode"
    };

    const newNode = {
      id: String(Date.now()),
      type: nodeTypeMap[shapeType.toLowerCase()] || "rectangleNode",
      data: { label: name, properties, color },
      position: { x: Math.random() * 250, y: Math.random() * 250 }
    };

    console.log("New Node:", newNode);

    setCanvasNodes(nds => {
      if (shouldClearCanvas) {
        setShouldClearCanvas(false);
        return [newNode];
      } else {
        return [...nds, newNode];
      }
    });

    setNodesList(nds => [...nds, newNode]);

    if (isComponent) {
      setEdges([]);
      setLibrary([...library, newNode]);
    }

    setPreviousNames(prev => [...prev, name]);

    handleClose();
  };

  const handleDeleteNode = id => {
    setCanvasNodes(nds => nds.filter(node => node.id !== id));
    setNodesList(nds => nds.filter(node => node.id !== id));
  };

  const handleDeleteLibrary = id => {
    setLibrary(library => library.filter(item => item.id !== id));
  };

  const onConnect = params => setEdges(eds => addEdge(params, eds));

  const onDrop = event => {
    event.preventDefault();
    const item = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );
    if (!item) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - 100;
    const y = event.clientY - rect.top - 100;

    if (item.defaultNodes && item.defaultEdges) {
      const newNodes = item.defaultNodes.map(node => ({
        ...node,
        position: { x: node.position.x + x, y: node.position.y + y },
        id: `${node.id}-${Date.now()}`
      }));
      const newEdges = item.defaultEdges.map(edge => ({
        ...edge,
        id: `${edge.id}-${Date.now()}`,
        source: `${edge.source}-${Date.now()}`,
        target: `${edge.target}-${Date.now()}`
      }));

      setCanvasNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
    } else {
      const newNode = {
        id: String(Date.now()),
        type: item.type,
        data: {
          label: item.data.label,
          properties: item.data.properties,
          color: item.data.color
        },
        position: { x, y }
      };

      setCanvasNodes(nds => [...nds, newNode]);
    }
  };

  return (
    <div onDrop={onDrop} onDragOver={event => event.preventDefault()}>
      <AppBar position="static">
        <Toolbar>
          <h1>Circuits</h1>
        </Toolbar>
      </AppBar>

      <Box display="flex" height="91vh">
        <Sidebar
          library={library}
          onCreateComponent={handleCreateComponent}
          onCreateNode={handleCreateNode}
          onDeleteLibrary={handleDeleteLibrary}
        />

        <FlowArea
          nodes={canvasNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          circuitLibrary={library}
          setCircuitLibrary={setLibrary}
          nodeTypes={{
            rectangleNode: RectangleNode,
            circleNode: CircleNode,
            squareNode: SquareNode
          }}
        />

        <Box
          width="250px"
          p={"16px 40px 0px"}
          bgcolor="grey.200"
          sx={{ textAlign: "center" }}
        >
          <h2>Nodes</h2>
          {nodesList
            .filter(node => !library.some(comp => comp.id === node.id))
            .map(node =>
              <Box
                key={node.id}
                draggable
                onDragStart={event =>
                  event.dataTransfer.setData(
                    "application/reactflow",
                    JSON.stringify(node)
                  )}
                sx={{
                  marginBottom: 3,
                  padding: "5px 20px",
                  fontSize: 18,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderRadius: `25px`,
                  boxShadow: `0px 0px 10px 2px ${node.data.color}`
                }}
              >
                <Box
                  sx={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "100%",
                    backgroundColor: node.data.color,
                    border: `2px solid ${node.data.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mr: 1
                  }}
                />
                {node.data.label}
                <IconButton
                  onClick={() => handleDeleteNode(node.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mt: 2
            }}
          >
            <IconButton color="primary" onClick={handleCreateNode}>
              <AddIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>
      <DialogBox
        open={open}
        onClose={handleClose}
        name={name}
        setName={setName}
        properties={properties}
        setProperties={setProperties}
        shapeType={shapeType}
        setShapeType={setShapeType}
        color={color}
        setColor={setColor}
        onSubmit={handleSubmit}
        isComponent={isComponent}
        previousNames={previousNames}
      />
    </div>
  );
};

export default DiagramTool;
