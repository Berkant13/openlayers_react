import React, { useRef, useState, useEffect } from "react";
import Map from "ol/Map";

import { OSM } from "ol/source";
import View from "ol/View";
import "./App.css";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";
import { Draw, Modify, Snap } from "ol/interaction";
import WKT from "ol/format/WKT";
import {
  Table,
  Modal,
  Button,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { Vector as VectorSource } from "ol/source";
import axios, { Axios } from "axios";

function App() {
  const mapRef = useRef();
  const [map, setMap] = useState();
  const [featuresLayer, setFeaturesLayer] = useState(null);
  const [modal, setModal] = useState(false);
  const typeSelect = useRef(null);
  const [drawSnapObj, setDrawSnapObj] = useState({});
  let wkt = new WKT();
  const [wkt_, setWkt_] = useState();
  const [update_modal,setUpdate_modal]=useState(false);
  const[güncelid,setGüncelid]=useState(0);
  const[source,setSource]=useState(new VectorSource());
  const [güncelSehir,setGüncelSehir]=useState("");
  const [güncelIlce,setGüncelIlce]=useState("");





  const deleteFunction = (e) => {
    const row=document.getElementById(e.target.id);

    var features=source.getFeatures();
    for(var i in features){
      var x=parseInt(features[i].id);
      var y=parseInt(e.target.id);
      if(x===y){
        source.removeFeature(features[i]);
      }
    }
    row.parentNode.removeChild(row);
    axios.delete("https://localhost:44382/api/location?id="+(e.target.id))
  };

  const updateTable=()=>{
  
    const row=document.getElementById(güncelid);
    
    row.cells[0].innerHTML=document.getElementById("güncel").value;
    row.cells[1].innerHTML=document.getElementById("güncelil").value;
    setUpdate_modal(!update_modal);

    axios.post("https://localhost:44382/api/location/update",{
      id:parseInt( güncelid),
      wkt:row.cells[2].innerHTML,
      sehir:document.getElementById("güncel").value,
      ilce:document.getElementById("güncelil").value,
    });
  };
  const updateFunction=(e)=>{
    setGüncelid(e.target.id);
    const row=document.getElementById(e.target.id)
    setGüncelSehir(row.cells[0].innerHTML)
    setGüncelIlce(row.cells[1].innerHTML)
    setUpdate_modal(!update_modal);
  }
  useEffect(() => {
    axios.get("https://localhost:44382/api/location").then((response) => {
      for (let i = 0; i < response.data.length; i++) {
        const table = document.getElementById("table");
        var btn = document.createElement("input");
        var btn_update = document.createElement("input");
        btn_update.id = response.data[i].id;
        btn_update.type = "button";
        btn_update.value = "U";
        btn.id = response.data[i].id;
        btn.type = "button";
        btn.value = "X";
        btn.addEventListener("click", deleteFunction);
        btn_update.addEventListener("click",updateFunction);
        const row = table.insertRow(1);
        row.id = response.data[i].id;
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        cell1.innerHTML = response.data[i].sehir;
        cell2.innerHTML = response.data[i].ilce;
        cell3.innerHTML = response.data[i].wkt;
        cell4.appendChild(btn);
        cell5.appendChild(btn_update);
        const format=new WKT();
        const draw_wkt=response.data[i].wkt;
        const feature=format.readFeature(draw_wkt,{
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:4326'
        })

        source.addFeature(feature);
        feature.id=response.data[i].id;
        feature.sehir=response.data[i].sehir;
        feature.ilce=response.data[i].ilce;
      }
    });

  }, []);

  const onChangeHandler = () => {
    map.removeInteraction(drawSnapObj.draw);
    map.removeInteraction(drawSnapObj.snap);
    addDrawSnap();
  };
  const addDrawSnap = () => {
    if (typeSelect.current.value === "None") {
      return false;
    }
    const draw = new Draw({
      source: featuresLayer.getSource(),
      type: typeSelect.current.value,
    });
    map.addInteraction(draw);
    const snap = new Snap({
      source: featuresLayer.getSource() });
    map.addInteraction(snap);
    setDrawSnapObj({ draw ,snap});
    draw.on("drawend", function (evt) {
      setWkt_(wkt.writeFeature(evt.feature));
      toggle();
    });


  };
  const vector = new VectorLayer({
    source: source,
    style: new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.2)",
      }),
      stroke: new Stroke({
        color: "#ffcc33",
        width: 2,
      }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: "#ffcc33",
        }),
      }),
    }),
  });
  useEffect(() => {

    if (!mapRef.current) {
      return;
    }
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vector,
      ],
      view: new View({
        center: [37.94729012167923, 39.41599548234691],
        zoom: 6,
        projection: "EPSG:4326",
      }),
    });
    setMap(map);
    setFeaturesLayer(vector);
    const modify = new Modify({ source: vector.getSource() });
      map.addInteraction(modify);
      modify.on("modifyend",function(e){
        const wkt_modify=e.features.getArray()[0];
        axios.post("https://localhost:44382/api/location/update",{
      id:parseInt( wkt_modify.id),
      wkt:wkt.writeFeature(wkt_modify),
      sehir:wkt_modify.sehir,
      ilce:wkt_modify.ilce,

    });
    const row_mod=document.getElementById(wkt_modify.id);
    row_mod.cells[2].innerHTML=wkt.writeFeature(wkt_modify);
      })
    return () => map.setTarget(undefined);
  }, []);

  const insertTable = () => {
    const table = document.getElementById("table");
    var btn = document.createElement("input");
    var btn_update = document.createElement("input");

    btn_update.type = "button";
    btn_update.value = "U";

    btn.type = "button";
    btn.value = "X";
    btn.addEventListener("click", deleteFunction);
    btn_update.addEventListener("click",updateFunction);
    const row = table.insertRow(1);

    var cell1 = row.insertCell(0);
    var cell2 = row.insertCell(1);
    var cell3 = row.insertCell(2);
    var cell4 = row.insertCell(3);
    var cell5 = row.insertCell(4);
    cell1.innerHTML = document.getElementById("sehir").value;
    cell2.innerHTML = document.getElementById("ilce").value;
    cell3.innerHTML = wkt_;
    cell4.appendChild(btn);
    cell5.appendChild(btn_update);
    const format=new WKT();
    const draw_wkt=wkt_
    const feature=format.readFeature(draw_wkt,{
      dataProjection: 'EPSG:4326',
      featureProjection: 'EPSG:4326'
    })

    feature.sehir=cell1.innerHTML;
    feature.ilce=cell2.innerHTML;
    axios.post("https://localhost:44382/api/location", {
      wkt: wkt_,
      sehir: document.getElementById("sehir").value,
      ilce: document.getElementById("ilce").value,
    }).then((response)=>{
      feature.id=response.data;
      btn.id=response.data;
      btn_update.id=response.data;
      row.id=response.data;
         source.clear();
    axios.get("https://localhost:44382/api/location").then((result) => {
      result.data.forEach(element => {
        const format=new WKT();
        const wkt_draw=element.wkt;
        const feature_d=format.readFeature(wkt_draw,{
               dataProjection: 'EPSG:4326',
              featureProjection: 'EPSG:4326'
       })
       feature_d.id=element.id;
       feature_d.sehir=element.sehir;
       feature_d.ilce=element.ilce;
      source.addFeature(feature_d);
      });
    });

    setModal(!modal);
    });
  };
  const iptal=()=>{
    const features=source.getFeatures();
    source.removeFeature(features[features.length-1]);
    setModal(!modal);
    
  }

  const toggle = () => {
   
    setModal(!modal);

  };

  const upt_toggle=()=>{
    setUpdate_modal(!update_modal)
    

  }
  const get_data=()=>{
    document.getElementById("güncel").value=güncelSehir;
    document.getElementById("güncelil").value=güncelIlce;
  }
 

  return (
    <div>
      <div>
        <select
          ref={typeSelect}
          defaultValue="None"
          onChange={() => onChangeHandler()}
        >
          <option value="None">None</option>
          <option value="Point">Point</option>
          <option value="LineString">LineString</option>
          <option value="Polygon">Polygon</option>
        </select>
        <Modal isOpen={update_modal} toggle={upt_toggle} onOpened={get_data}>
          <ModalHeader toggle={upt_toggle}>UPDATE POINT</ModalHeader>
          <ModalBody>
            <div>
              <label>GÜNCEL ŞEHİR: </label>
              <input type="text" id="güncel" name="güncel"></input>
            </div>
            <div>
              <label>GÜNCEL İLÇE:</label>
              <input type="text" id="güncelil"name="güncelil"></input>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={updateTable} id="güncel">
             Güncelle
            </Button>
          </ModalFooter>
        </Modal>


        <Modal isOpen={modal} toggle={toggle} backdrop="static">
          <ModalHeader toggle={toggle}>ADD POINT</ModalHeader>
          <ModalBody>
            <div>
              <label>ŞEHİR: </label>
              <input type="text" id="sehir" name="sehir"></input>
            </div>
            <div>
              <label>İLÇE:</label>
              <input type="text" id="ilce" name="ilce"></input>
            </div>
          </ModalBody>
          <ModalFooter>
          <Button color="danger" onClick={iptal}>İptal</Button>
            <Button color="primary" onClick={insertTable} id="ekle">
              Ekle
            </Button>
            
          </ModalFooter>
        </Modal>
      </div>
      <div ref={mapRef} id="map" className="map"></div>
      <div>
        <Table id="table">
          <thead>
            <tr>
              <th>Şehir</th>
              <th>İlçe</th>
              <th>Wkt</th>
              <th>Delete</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody></tbody>
        </Table>
      </div>
    </div>
  );
}

export default App;
