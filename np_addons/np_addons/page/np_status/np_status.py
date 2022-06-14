from __future__ import unicode_literals
import frappe
from frappe import _
from datetime import date, datetime
from frappe.utils import get_url_to_form, get_site_path
import json
from frappe.utils.background_jobs import enqueue
from numpy import size

@frappe.whitelist()
def get_so(offset=None, limit=None, filters=None):
    filters = json.loads(filters)
    conditions = ""
    if filters.get('orderno') is not None:
        conditions += "tso.name = '{}' and ".format(filters.get('orderno'))
    if filters.get('company') is not None:
        conditions += "tso.company = '{}' and ".format(filters.get('company'))
    conditions += "tso.customer = 'STYLE TEXTILE (PVT) LTD.' and "
    # if filters.get('project') is not None:
    #     conditions += "tso.project = '{}' and ".format(filters.get('project'))
    # if filters.get('orderdate') is not None:
    #     conditions += "so.transaction_date between '{}' and '{}' and ".format(filters.get('orderdate')[0], filters.get('orderdate')[1])
    conditions = conditions.strip("and ")
    if conditions != "":
        conditions = "where " + conditions
  
    sql = """select DISTINCT
            tso.name as sales_order,
            tso.customer,
            tso.po_no,
            tso.total_qty
        from
            `tabSales Order` tso
            left join `tabSales Order Item` tsoi
            on tsoi.parent = tso.name
            {conditions}
            """.format(conditions=conditions)
    so_list = frappe.db.sql(sql, as_dict=True)

    for so in so_list:
        so.update({"items": get_so_items(so.sales_order)})
        
    return so_list


@frappe.whitelist()
def get_so_items(so=None):
    item_list = frappe.db.sql("""select DISTINCT
             *
        from
            `tabSales Order Item` tsoi
            where parent = '{}'
            """.format(so), as_dict=True)

    return item_list
