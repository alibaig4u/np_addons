from __future__ import unicode_literals
from braintree import Customer
import frappe
from frappe import _
from datetime import date, datetime
from frappe.utils import get_url_to_form, get_site_path
import json
from frappe.utils.background_jobs import enqueue
from numpy import size


@frappe.whitelist()
def getCustomer():
    customer =  frappe.get_list("Customer", fields="name")[0].name if len(frappe.get_list("Customer", fields="name")) > 0 else ""
    return customer


@frappe.whitelist()
def get_tiles_value():
    tiles_data = frappe.db.sql("""select 
            c.customer,
            sum(c.so_count) as so_count,
            sum(c.dn_count) as dn_count, 
            sum(c.si_count) as si_count, 
            sum(c.total_amount) as total_sales_amount, 
            sum(c.total_outstanding_amount) as total_outstanding_amount
            from 
            (
                (
                    select tso.customer,count(*) as so_count, 0 as dn_count, 0 as si_count, 0 as total_amount, 0 as total_outstanding_amount 
                    from `tabSales Order` tso
                    where tso.docstatus != 2 
                    group by tso.customer
                )
                UNION
                (
                    select tdn.customer, 0 as so_count, count(*) as dn_count, 0 as si_count, 0 as total_amount, 0 as total_outstanding_amount 
                    from `tabDelivery Note` tdn 
                    where tdn.docstatus != 2
                    group by tdn.customer
                )
                UNION
                (
                    select tsi.customer, 0 as so_count, 0 as dn_count, count(*) as si_count, sum(tsi.grand_total) as total_amount, sum(tsi.outstanding_amount) as total_outstanding_amount  
                    from `tabSales Invoice` tsi 
                    where tsi.docstatus != 2
                    group by tsi.customer
                )

            ) as c
            where c.customer = "{customer}"
            group by c.customer
    """.format(customer=getCustomer()), as_dict=True)
    return tiles_data

@frappe.whitelist()
def get_so(offset=None, limit=None, filters=None):
    filters = json.loads(filters)
    conditions = ""
    if filters.get('orderno') is not None:
        conditions += "tso.name = '{}' and ".format(filters.get('orderno'))
    if filters.get('customer') is not None:
        conditions += "tso.customer = '{}' and ".format(filters.get('customer'))
    # if filters.get('project') is not None:
    #     conditions += "tso.project = '{}' and ".format(filters.get('project'))
    # if filters.get('orderdate') is not None:
    conditions += "tso.docstatus != 2 and "
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
        so.update({"items": get_so_items(so.sales_order, so.customer)})
        
    return so_list


@frappe.whitelist()
def get_so_items(so=None, customer=None):
    item_list = frappe.db.sql("""select DISTINCT
             tsoi.item_name,
             COALESCE(tsoi.qty,0) qty,
             IFNULL(tsoi.plan_no,"") plan_no,
             (select
                    COALESCE(sum(qty), 0) as qty
                from
                    `tabDelivery Note` tdn
                left join
                `tabDelivery Note Item` tdni 
                on
                    tdn.name = tdni.parent
                where
                    tdn.docstatus != 2
                    and tdn.customer = "{customer}"
                    and tdni.item_code = tsoi.item_code) as delivery_qty,
            (select
                    COALESCE(sum(qty), 0) as qty
                from
                    `tabSales Invoice` tsi
                left join
                `tabSales Invoice Item` tsii 
                on
                    tsi.name = tsii.parent
                where
                    tsi.docstatus != 2
                    and tsi.customer = "{customer}"
                    and tsii.item_code = tsoi.item_code) as invoice_qty	
        from
            `tabSales Order Item` tsoi
            where parent = '{so}'
            """.format(so=so,customer=customer), as_dict=True)

    return item_list
