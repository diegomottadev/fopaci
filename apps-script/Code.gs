/**
 * SETUP:
 * 1. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 2. Copy the deployment URL into .env as VITE_WEBHOOK_PEDIDOS
 *
 * NOTE: The PWA sends data via GET query params (?action=crear&pedido={...}) because
 * Apps Script's exec URL issues a 302 redirect on POST requests, which causes browsers
 * to drop the POST body before it reaches doPost. GET requests go through directly.
 */

var SHEET_NAME = 'Pedidos';
var SHEET_ID = "1Sh8KbHajmaIKpFAlQYA-0LX4nC8iiea4EfhoUFqYKPU";

function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    var sheets = ss.getSheets();
    if (sheets.length > 0 && sheets[0].getName() !== SHEET_NAME) {
      sheets[0].setName(SHEET_NAME);
      sheet = sheets[0];
    } else {
      sheet = ss.insertSheet(SHEET_NAME);
    }
  }
  return sheet;
}

function processRequest(data) {
  var action = data.action;
  var pedido = data.pedido;
  var sheet = getSheet();

  if (action === 'crear') {
    appendPedido(sheet, pedido);
  } else if (action === 'editar') {
    deletePedidoRows(sheet, pedido.pedidoId);
    appendPedido(sheet, pedido);
  } else if (action === 'cancelar') {
    updateEstado(sheet, pedido.pedidoId, 'Cancelado');
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Primary handler — receives data as GET params to avoid POST redirect issues
function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action) {
      var data = {
        action: e.parameter.action,
        pedido: JSON.parse(e.parameter.pedido)
      };
      return processRequest(data);
    }

    // Diagnostic — open the URL in a browser with no params to verify connectivity
    var sheet = getSheet();
    var info = {
      sheetName: sheet.getName(),
      lastRow: sheet.getLastRow(),
      lastCol: sheet.getLastColumn(),
      firstRow: sheet.getLastRow() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [],
    };
    return ContentService
      .createTextOutput(JSON.stringify(info, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err.message);
  }
}

// Kept for direct testing via curl/Postman
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    return processRequest(data);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Fecha', 'Vendedor', 'Cliente', 'DNI/CUIL',
      'Código', 'Descripción', 'Unidades', 'Precio Unitario', 'Descuento %', 'Subtotal',
      'Descuento General %', 'Total', 'Estado', 'Observacion', 'Pedido ID', 'Nombre Comercial'
    ]);
  }
}

function appendPedido(sheet, pedido) {
  ensureHeaders(sheet);
  pedido.items.forEach(function(item) {
    sheet.appendRow([
      pedido.fecha,
      pedido.vendedor,
      pedido.cliente,
      pedido.dniCuilCodigo,
      item.codigo,
      item.descripcion,
      item.unidades,
      item.precioUnitario,
      item.descuento || 0,
      item.subtotal,
      pedido.descuentoGeneral || 0,
      pedido.total,
      pedido.estado,
      pedido.observacion || '',
      pedido.pedidoId,
      pedido.nombreComercial || '',
    ]);
  });
}

function deletePedidoRows(sheet, pedidoId) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (String(data[i][14]) === String(pedidoId)) {
      sheet.deleteRow(i + 1);
    }
  }
}

function updateEstado(sheet, pedidoId, newEstado) {
  var data = sheet.getDataRange().getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][14]) === String(pedidoId)) {
      sheet.getRange(i + 1, 13).setValue(newEstado);
    }
  }
}

function debugSheetNames() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var names = ss.getSheets().map(function(s) { return s.getName(); });
  Logger.log('Tabs found: ' + names.join(', '));
}
