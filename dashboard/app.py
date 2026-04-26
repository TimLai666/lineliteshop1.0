import os
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import plotly.express as px
import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_URL = os.getenv("GOOGLE_SHEET_API_URL", "")
API_TOKEN = os.getenv("GOOGLE_SHEET_API_TOKEN", "")

st.set_page_config(page_title="LineLiteShop 商家儀表板", page_icon="🛒", layout="wide")


@st.cache_data(ttl=120, show_spinner=False)
def fetch_sheet(sheet: str) -> list[dict]:
    if not API_URL or not API_TOKEN:
        raise RuntimeError("缺少 GOOGLE_SHEET_API_URL 或 GOOGLE_SHEET_API_TOKEN 環境變數")
    resp = requests.get(
        API_URL,
        params={"token": API_TOKEN, "sheet": sheet},
        timeout=30,
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get("status") != "success":
        raise RuntimeError(payload.get("message") or f"取得 {sheet} 失敗")
    return payload.get("data") or []


def to_number(series: pd.Series) -> pd.Series:
    return pd.to_numeric(series, errors="coerce").fillna(0)


def load_all() -> dict[str, pd.DataFrame]:
    return {
        "orders": pd.DataFrame(fetch_sheet("ORDERS")),
        "products": pd.DataFrame(fetch_sheet("PRODUCTS")),
        "customers": pd.DataFrame(fetch_sheet("CUSTOMERS")),
        "categories": pd.DataFrame(fetch_sheet("CATEGORIES")),
    }


def normalize_orders(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.copy()
    df["time"] = pd.to_datetime(df["time"], errors="coerce", utc=True).dt.tz_convert(
        "Asia/Taipei"
    ).dt.tz_localize(None)
    df["totalAmount"] = to_number(df.get("totalAmount", pd.Series(dtype=float)))
    df["status"] = df["status"].fillna("").astype(str)
    df["item_count"] = df["products"].apply(
        lambda items: sum(int(i.get("quantity", 0) or 0) for i in (items or []))
    )
    return df


def normalize_products(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    df = df.copy()
    df["price"] = to_number(df.get("price", pd.Series(dtype=float)))
    df["stock"] = to_number(df.get("stock", pd.Series(dtype=float)))
    return df


# ---------- Sidebar ----------
st.sidebar.title("🛒 LineLiteShop")
st.sidebar.caption("商家儀表板")

if st.sidebar.button("🔄 重新整理資料", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

page = st.sidebar.radio("頁面", ["總覽", "訂單", "商品", "顧客"], label_visibility="collapsed")

# ---------- Load ----------
try:
    with st.spinner("載入 Google Sheet 資料中…"):
        data = load_all()
except Exception as exc:
    st.error(f"資料載入失敗：{exc}")
    st.stop()

orders = normalize_orders(data["orders"])
products = normalize_products(data["products"])
customers = data["customers"]
categories = data["categories"]

# ---------- Pages ----------
if page == "總覽":
    st.title("📊 營運總覽")

    today = datetime.now().date()
    last_30 = pd.Timestamp(today - timedelta(days=30))
    valid_orders = orders[orders["status"] != "已取消"] if not orders.empty else orders
    revenue = float(valid_orders["totalAmount"].sum()) if not valid_orders.empty else 0
    recent = (
        valid_orders[valid_orders["time"] >= last_30]
        if not valid_orders.empty
        else valid_orders
    )
    recent_revenue = float(recent["totalAmount"].sum()) if not recent.empty else 0

    c1, c2, c3, c4 = st.columns(4)
    c1.metric("總營收", f"NT$ {revenue:,.0f}")
    c2.metric("近 30 天營收", f"NT$ {recent_revenue:,.0f}")
    c3.metric("有效訂單數", len(valid_orders))
    c4.metric("顧客總數", len(customers))

    c5, c6, c7 = st.columns(3)
    c5.metric("商品總數", len(products))
    low_stock = products[products["stock"] <= 5] if not products.empty else products
    c6.metric("低庫存商品 (≤5)", len(low_stock))
    sold_out = (
        products[products["status"].astype(str) == "已售完"]
        if not products.empty
        else products
    )
    c7.metric("已售完商品", len(sold_out))

    st.divider()

    if not valid_orders.empty:
        col_a, col_b = st.columns(2)
        with col_a:
            st.subheader("近 30 天每日營收")
            daily = (
                recent.assign(date=recent["time"].dt.date)
                .groupby("date", as_index=False)["totalAmount"]
                .sum()
            )
            if not daily.empty:
                fig = px.bar(daily, x="date", y="totalAmount", labels={"date": "日期", "totalAmount": "營收"})
                fig.update_layout(height=350, margin=dict(l=0, r=0, t=10, b=0))
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("近 30 天無訂單")

        with col_b:
            st.subheader("訂單狀態分佈")
            status_counts = orders["status"].value_counts().reset_index()
            status_counts.columns = ["status", "count"]
            fig = px.pie(status_counts, names="status", values="count", hole=0.4)
            fig.update_layout(height=350, margin=dict(l=0, r=0, t=10, b=0))
            st.plotly_chart(fig, use_container_width=True)

        st.subheader("熱銷商品 Top 10")
        rows = []
        for _, order in valid_orders.iterrows():
            for item in order["products"] or []:
                rows.append(
                    {
                        "product": item.get("product"),
                        "quantity": int(item.get("quantity", 0) or 0),
                    }
                )
        if rows:
            top_products = (
                pd.DataFrame(rows)
                .groupby("product", as_index=False)["quantity"]
                .sum()
                .sort_values("quantity", ascending=False)
                .head(10)
            )
            fig = px.bar(top_products, x="quantity", y="product", orientation="h")
            fig.update_layout(
                height=400, margin=dict(l=0, r=0, t=10, b=0), yaxis={"categoryorder": "total ascending"}
            )
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("尚無訂單資料")

elif page == "訂單":
    st.title("📦 訂單明細")
    if orders.empty:
        st.info("尚無訂單")
    else:
        col1, col2, col3 = st.columns([2, 2, 3])
        statuses = ["全部"] + sorted(orders["status"].dropna().unique().tolist())
        sel_status = col1.selectbox("狀態", statuses)

        min_t = orders["time"].min()
        max_t = orders["time"].max()
        default_start = (max_t - pd.Timedelta(days=30)).date() if pd.notna(max_t) else datetime.now().date()
        default_end = max_t.date() if pd.notna(max_t) else datetime.now().date()
        date_range = col2.date_input(
            "日期區間",
            value=(default_start, default_end),
            min_value=min_t.date() if pd.notna(min_t) else None,
            max_value=max_t.date() if pd.notna(max_t) else None,
        )
        keyword = col3.text_input("搜尋顧客姓名 / ID / 備註")

        filtered = orders.copy()
        if sel_status != "全部":
            filtered = filtered[filtered["status"] == sel_status]
        if isinstance(date_range, tuple) and len(date_range) == 2:
            start, end = date_range
            filtered = filtered[
                (filtered["time"].dt.date >= start) & (filtered["time"].dt.date <= end)
            ]
        if keyword:
            kw = keyword.lower()
            filtered = filtered[
                filtered.apply(
                    lambda r: kw in str(r.get("customer_name", "")).lower()
                    or kw in str(r.get("customer_id", "")).lower()
                    or kw in str(r.get("customer_note", "")).lower(),
                    axis=1,
                )
            ]

        c1, c2, c3 = st.columns(3)
        c1.metric("筆數", len(filtered))
        c2.metric("總金額", f"NT$ {filtered['totalAmount'].sum():,.0f}")
        c3.metric("總商品件數", int(filtered["item_count"].sum()))

        display = filtered.assign(
            products_text=filtered["products"].apply(
                lambda items: "、".join(
                    f"{i.get('product')}×{i.get('quantity')}" for i in (items or [])
                )
            )
        )[
            ["id", "time", "status", "customer_name", "customer_id",
             "products_text", "totalAmount", "customer_note", "internal_note"]
        ].rename(
            columns={
                "id": "訂單ID",
                "time": "時間",
                "status": "狀態",
                "customer_name": "顧客",
                "customer_id": "顧客ID",
                "products_text": "商品",
                "totalAmount": "金額",
                "customer_note": "顧客備註",
                "internal_note": "內部備註",
            }
        ).sort_values("時間", ascending=False)

        st.dataframe(display, use_container_width=True, hide_index=True)

elif page == "商品":
    st.title("🛍️ 商品庫存")
    if products.empty:
        st.info("尚無商品")
    else:
        col1, col2 = st.columns(2)
        cats = ["全部"] + sorted([c for c in products["category"].dropna().unique().tolist() if c])
        sel_cat = col1.selectbox("類別", cats)
        statuses = ["全部"] + sorted(products["status"].dropna().unique().tolist())
        sel_status = col2.selectbox("狀態", statuses)

        view = products.copy()
        if sel_cat != "全部":
            view = view[view["category"] == sel_cat]
        if sel_status != "全部":
            view = view[view["status"] == sel_status]

        c1, c2, c3 = st.columns(3)
        c1.metric("商品數", len(view))
        c2.metric("總庫存", int(view["stock"].sum()))
        c3.metric("庫存價值", f"NT$ {(view['stock'] * view['price']).sum():,.0f}")

        st.subheader("各類別庫存")
        by_cat = products.groupby("category", as_index=False).agg(
            商品數=("name", "count"), 總庫存=("stock", "sum")
        )
        fig = px.bar(by_cat, x="category", y="總庫存", hover_data=["商品數"])
        fig.update_layout(height=320, margin=dict(l=0, r=0, t=10, b=0))
        st.plotly_chart(fig, use_container_width=True)

        st.subheader("商品列表")
        display = view[["name", "category", "price", "stock", "status", "description"]].rename(
            columns={
                "name": "名稱",
                "category": "類別",
                "price": "價格",
                "stock": "庫存",
                "status": "狀態",
                "description": "說明",
            }
        )
        st.dataframe(display, use_container_width=True, hide_index=True)

        low = view[view["stock"] <= 5]
        if not low.empty:
            st.warning(f"⚠️ 低庫存商品（≤5）：{len(low)} 項")
            st.dataframe(
                low[["name", "category", "stock", "status"]].rename(
                    columns={"name": "名稱", "category": "類別", "stock": "庫存", "status": "狀態"}
                ),
                use_container_width=True,
                hide_index=True,
            )

elif page == "顧客":
    st.title("👥 顧客名單")
    if customers.empty:
        st.info("尚無顧客")
    else:
        keyword = st.text_input("搜尋姓名 / ID / Email / 電話")
        view = customers.copy()
        if keyword:
            kw = keyword.lower()
            view = view[
                view.apply(
                    lambda r: any(
                        kw in str(r.get(f, "")).lower() for f in ["name", "id", "email", "phone"]
                    ),
                    axis=1,
                )
            ]

        c1, c2 = st.columns(2)
        c1.metric("顧客總數", len(customers))
        c2.metric("篩選結果", len(view))

        if "gender" in view.columns and view["gender"].notna().any():
            col_a, col_b = st.columns(2)
            with col_a:
                st.subheader("性別分佈")
                g = view["gender"].replace("", pd.NA).dropna().value_counts().reset_index()
                g.columns = ["gender", "count"]
                if not g.empty:
                    fig = px.pie(g, names="gender", values="count", hole=0.4)
                    fig.update_layout(height=300, margin=dict(l=0, r=0, t=10, b=0))
                    st.plotly_chart(fig, use_container_width=True)
            with col_b:
                if "income_range" in view.columns:
                    st.subheader("收入區間")
                    inc = (
                        view["income_range"].replace("", pd.NA).dropna().value_counts().reset_index()
                    )
                    inc.columns = ["income_range", "count"]
                    if not inc.empty:
                        fig = px.bar(inc, x="income_range", y="count")
                        fig.update_layout(height=300, margin=dict(l=0, r=0, t=10, b=0))
                        st.plotly_chart(fig, use_container_width=True)

        st.subheader("顧客列表")
        st.dataframe(view, use_container_width=True, hide_index=True)

st.sidebar.caption(f"資料快取 120 秒｜{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
