"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import * as turf from "@turf/turf";

// Fix de iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type MapaPrecisionProps = {
  lotes: any[];
  onLoteCreado?: (coordenadas: any, hectareas: number) => void;
  onMarcadorCreado?: (latitud: number, longitud: number) => void;
  centroInicial?: [number, number];
  zoomInicial?: number;
  modoEdicion?: boolean;
};

export default function MapaPrecision({
  lotes = [],
  onLoteCreado,
  onMarcadorCreado,
  centroInicial = [-34.9011, -56.1645], // Montevideo
  zoomInicial = 13,
  modoEdicion = false,
}: MapaPrecisionProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [capaSatelital, setCapaSatelital] = useState<string>("osm");

  useEffect(() => {
    if (mapRef.current) return; // Ya inicializado

    // Inicializar mapa
    const map = L.map("mapa-precision").setView(centroInicial, zoomInicial);

    // Capas base
    const capas: { [key: string]: L.TileLayer } = {
      osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }),
      satelite: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© Esri",
          maxZoom: 19,
        }
      ),
      hibrido: L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "© Esri",
          maxZoom: 19,
        }
      ),
    };

    capas.osm.addTo(map);

    // Controles de capas
    const controlesCapas = L.control.layers(
      {
        Mapa: capas.osm,
        Satélite: capas.satelite,
        Híbrido: capas.hibrido,
      },
      {},
      { position: "topright" }
    );
    controlesCapas.addTo(map);

    // Capa para dibujos
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    if (modoEdicion) {
      // CONFIGURACIÓN MEJORADA de controles de dibujo
      const drawControl = new L.Control.Draw({
        position: "topleft",
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true, // ← Mostrar área mientras dibuja
            shapeOptions: {
              color: "#5e7733",
              weight: 3,
              fillOpacity: 0.2,
            },
            // Mensajes en español
            drawError: {
              color: "#e74c3c",
              timeout: 2000,
            },
          },
          rectangle: {
            showArea: true, // ← Mostrar área
            shapeOptions: {
              color: "#5e7733",
              weight: 3,
              fillOpacity: 0.2,
            },
          },
          circle: false,
          circlemarker: false,
          polyline: false,
          marker: {
            icon: L.icon({
              iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
              iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
              shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            }),
          },
        },
        edit: {
          featureGroup: drawnItems,
          remove: true,
        },
      });
      map.addControl(drawControl);

      // Tocar el mapa fija/mueve un único marcador de ubicación (sin usar el toolbar).
      if (onMarcadorCreado) {
        let puntoMarker: L.Marker | null = null;
        map.on("click", (e: L.LeafletMouseEvent) => {
          if (puntoMarker) puntoMarker.setLatLng(e.latlng);
          else puntoMarker = L.marker(e.latlng).addTo(map);
          onMarcadorCreado(e.latlng.lat, e.latlng.lng);
        });
      }

      // Eventos de dibujo
      map.on(L.Draw.Event.CREATED, (e: any) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);

        if (e.layerType === "polygon" || e.layerType === "rectangle") {
          // Calcular hectáreas
          const latlngs = layer.getLatLngs()[0];
          const coords = latlngs.map((ll: any) => [ll.lng, ll.lat]);
          coords.push(coords[0]); // Cerrar el polígono
          
          const polygon = turf.polygon([coords]);
          const area = turf.area(polygon);
          const hectareas = area / 10000; // m² a ha

          // GeoJSON
          const geoJSON = layer.toGeoJSON();

          if (onLoteCreado) {
            onLoteCreado(geoJSON, hectareas);
          }

          // Popup con info
          layer.bindPopup(
            `<strong>Nuevo Lote</strong><br/>Área: ${hectareas.toFixed(2)} ha`
          ).openPopup();
          
          // Limpiar después de crear
          setTimeout(() => {
            drawnItems.removeLayer(layer);
          }, 500);
        } else if (e.layerType === "marker") {
          const latlng = layer.getLatLng();
          if (onMarcadorCreado) {
            onMarcadorCreado(latlng.lat, latlng.lng);
          }

          layer.bindPopup("<strong>Nuevo Marcador</strong>").openPopup();
          
          // Limpiar después de crear
          setTimeout(() => {
            drawnItems.removeLayer(layer);
          }, 500);
        }
      });
    }

    // Cargar lotes existentes
    lotes.forEach((lote) => {
      if (lote.coordenadas) {
        try {
          const geoJSON = JSON.parse(lote.coordenadas);
          const layer = L.geoJSON(geoJSON, {
            style: {
              color: "#5e7733",
              weight: 2,
              fillOpacity: 0.2,
            },
          });

          layer.bindPopup(`
            <div class="p-2">
              <strong class="text-lg">${lote.nombre}</strong><br/>
              <span class="text-sm text-gray-600">Área: ${lote.hectareas.toFixed(2)} ha</span><br/>
              ${lote.cultivo ? `<span class="text-sm">Cultivo: ${lote.cultivo}</span>` : ""}
            </div>
          `);

          layer.addTo(map);
        } catch (error) {
          console.error("Error cargando lote:", lote.nombre, error);
        }
      } else if (lote.centroLatitud && lote.centroLongitud) {
        // Si solo tiene centro, mostrar marcador
        L.marker([lote.centroLatitud, lote.centroLongitud])
          .bindPopup(`
            <div class="p-2">
              <strong class="text-lg">${lote.nombre}</strong><br/>
              <span class="text-sm text-gray-600">${lote.hectareas} ha</span><br/>
              ${lote.cultivo ? `<span class="text-sm">Cultivo: ${lote.cultivo}</span>` : ""}
            </div>
          `)
          .addTo(map);
      }
    });

    mapRef.current = map;

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lotes, modoEdicion]);

  return (
    <div className="relative w-full h-full">
      <div id="mapa-precision" className="w-full h-full rounded-lg" />
      
      {/* Instrucciones flotantes */}
      {modoEdicion && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg shadow-lg z-[1000] text-sm">
          <p className="font-medium text-gray-700">
            <strong>Polígono:</strong> Click en el primer punto para cerrar | 
            <strong> Rectángulo:</strong> Más fácil, click y arrastrá
          </p>
        </div>
      )}
    </div>
  );
}