import os
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests
import streamlit as st
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

API_URL = os.getenv("GOOGLE_SHEET_API_URL", "")
API_TOKEN = os.getenv("GOOGLE_SHEET_API_TOKEN", "")

RFM_MEMBER_TYPES = [
    {"代碼": "111", "會員類型": "需開發會員", "說明": "分數低於平均。", "行銷建議": "首購折扣、新手任務"},
    {"代碼": "112", "會員類型": "重要挽留會員", "說明": "消費金額高，但近期未上門，且消費頻率低。", "行銷建議": "回流禮、Win-back"},
    {"代碼": "121", "會員類型": "一般保持會員", "說明": "消費頻率高，但近期未上門，且消費金額少。", "行銷建議": "集點、社群互動"},
    {"代碼": "122", "會員類型": "重要保持會員", "說明": "消費頻率高，消費金額高，但近期未上門。", "行銷建議": "VIP 搶先購、升等"},
    {"代碼": "211", "會員類型": "流失會員", "說明": "近期有消費，消費頻率與金額均低。", "行銷建議": "問卷釐因、定向優惠"},
    {"代碼": "212", "會員類型": "重要發展會員", "說明": "近期有消費，消費頻率低，但消費金額高。", "行銷建議": "訂閱制、高客單加購"},
    {"代碼": "221", "會員類型": "一般價值會員", "說明": "近期有消費，且消費頻率高，但消費金額低。", "行銷建議": "加價升級、遊戲化"},
    {"代碼": "222", "會員類型": "重要價值會員", "說明": "近期有消費，且消費頻率和金額都高。", "行銷建議": "尊榮計畫、共創活動"},
]

CAI_TREND_DESCRIPTION = {
    "活躍": "顧客回購的時間間隔越來越短，活躍度持續上升。",
    "固定": "顧客回購的時間間隔大致穩定，行為平穩。",
    "沉寂": "顧客回購的時間間隔越來越長，正在遠離。",
}

PAGES = ["總覽", "訂單", "商品", "顧客"]
CAI_COLOR_MAP = {
    "沉寂": "#d94841",
    "固定": "#d99a22",
    "活躍": "#2f9e44",
    "未分類": "#8c8c8c",
}

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


def safe_quantity(value: object) -> int:
    try:
        return int(float(value or 0))
    except (TypeError, ValueError):
        return 0


def expand_order_items(order_df: pd.DataFrame) -> pd.DataFrame:
    if order_df.empty or "products" not in order_df.columns or "time" not in order_df.columns:
        return pd.DataFrame(columns=["date", "time", "product", "quantity"])

    rows = []
    for _, order in order_df.iterrows():
        order_time = order.get("time")
        if pd.isna(order_time):
            continue
        for item in order.get("products") or []:
            if not isinstance(item, dict):
                continue
            product_name = str(item.get("product") or "").strip()
            quantity = safe_quantity(item.get("quantity"))
            if not product_name or quantity <= 0:
                continue
            rows.append(
                {
                    "date": order_time.date(),
                    "time": order_time,
                    "product": product_name,
                    "quantity": quantity,
                }
            )

    return pd.DataFrame(rows, columns=["date", "time", "product", "quantity"])


def build_product_daily_quantity(order_items: pd.DataFrame) -> pd.DataFrame:
    if order_items.empty:
        return pd.DataFrame(columns=["date", "product", "quantity"])

    product_daily = (
        order_items.groupby(["date", "product"], as_index=False)["quantity"]
        .sum()
        .sort_values(["date", "product"])
    )
    date_index = pd.date_range(
        product_daily["date"].min(), product_daily["date"].max(), freq="D"
    ).date
    product_matrix = (
        product_daily.pivot(index="date", columns="product", values="quantity")
        .reindex(date_index, fill_value=0)
        .fillna(0)
    )
    return product_matrix.reset_index(names="date").melt(
        id_vars="date", var_name="product", value_name="quantity"
    )


def compute_customer_rfm_values(order_df: pd.DataFrame) -> pd.DataFrame:
    required = {"customer_id", "time", "totalAmount"}
    if order_df.empty or not required.issubset(order_df.columns):
        return pd.DataFrame(columns=["customer_id", "R值", "F值", "M值", "最後訂購時間"])

    valid = order_df.dropna(subset=["time"]).copy()
    valid["customer_id"] = valid["customer_id"].fillna("").astype(str).str.strip()
    valid = valid[valid["customer_id"] != ""]
    if valid.empty:
        return pd.DataFrame(columns=["customer_id", "R值", "F值", "M值", "最後訂購時間"])

    today = pd.Timestamp(datetime.now().date())
    frequency_col = "id" if "id" in valid.columns else "time"
    grouped = (
        valid.groupby("customer_id", as_index=False)
        .agg(
            最後訂購時間=("time", "max"),
            F值=(frequency_col, "count"),
            M值=("totalAmount", "sum"),
        )
    )
    grouped["R值"] = (today - grouped["最後訂購時間"].dt.normalize()).dt.days.clip(lower=0)
    return grouped[["customer_id", "R值", "F值", "M值", "最後訂購時間"]]


def padded_range(series: pd.Series) -> tuple[float, float]:
    values = pd.to_numeric(series, errors="coerce").dropna()
    if values.empty:
        return 0.0, 1.0
    minimum = float(values.min())
    maximum = float(values.max())
    if minimum == maximum:
        padding = max(abs(minimum) * 0.05, 1.0)
        return minimum - padding, maximum + padding
    padding = (maximum - minimum) * 0.05
    return minimum - padding, maximum + padding


def add_rfm_quadrant_planes(fig: go.Figure, plot_df: pd.DataFrame) -> None:
    x_min, x_max = padded_range(plot_df["R值"])
    y_min, y_max = padded_range(plot_df["F值"])
    z_min, z_max = padded_range(plot_df["M值"])
    x_mid = float(plot_df["R值"].median())
    y_mid = float(plot_df["F值"].median())
    z_mid = float(plot_df["M值"].median())

    plane_style = dict(
        colorscale=[[0, "#64748b"], [1, "#64748b"]],
        opacity=0.12,
        showscale=False,
        hoverinfo="skip",
        showlegend=False,
    )
    fig.add_trace(
        go.Surface(
            x=[[x_mid, x_mid], [x_mid, x_mid]],
            y=[[y_min, y_max], [y_min, y_max]],
            z=[[z_min, z_min], [z_max, z_max]],
            name="R中位數",
            **plane_style,
        )
    )
    fig.add_trace(
        go.Surface(
            x=[[x_min, x_max], [x_min, x_max]],
            y=[[y_mid, y_mid], [y_mid, y_mid]],
            z=[[z_min, z_min], [z_max, z_max]],
            name="F中位數",
            **plane_style,
        )
    )
    fig.add_trace(
        go.Surface(
            x=[[x_min, x_max], [x_min, x_max]],
            y=[[y_min, y_min], [y_max, y_max]],
            z=[[z_mid, z_mid], [z_mid, z_mid]],
            name="M中位數",
            **plane_style,
        )
    )


# ---------- Sidebar ----------
st.sidebar.title("🛒 LineLiteShop")
st.sidebar.caption("商家儀表板")

if st.sidebar.button("🔄 重新整理資料", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

if "dashboard_page" not in st.session_state:
    st.session_state.dashboard_page = PAGES[0]

for page_name in PAGES:
    if st.sidebar.button(
        page_name,
        key=f"nav_{page_name}",
        type="primary" if st.session_state.dashboard_page == page_name else "secondary",
        use_container_width=True,
    ):
        st.session_state.dashboard_page = page_name
        st.rerun()

page = st.session_state.dashboard_page

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

        order_items = expand_order_items(valid_orders)

        if not order_items.empty:
            st.subheader("各商品訂購量時間變化")
            product_daily = build_product_daily_quantity(order_items)
            fig = px.line(
                product_daily,
                x="date",
                y="quantity",
                color="product",
                markers=True,
                labels={"date": "日期", "quantity": "訂購量", "product": "商品"},
            )
            fig.update_layout(
                height=430,
                margin=dict(l=0, r=0, t=10, b=0),
                legend_title_text="商品",
            )
            fig.update_yaxes(rangemode="tozero")
            st.plotly_chart(fig, use_container_width=True)

        st.subheader("熱銷商品 Top 10")
        if not order_items.empty:
            top_products = (
                order_items
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

        def nonempty(series: pd.Series) -> pd.Series:
            return series.replace("", pd.NA).dropna()

        rfm_series = nonempty(view["rfm_member_type"]) if "rfm_member_type" in view.columns else pd.Series(dtype=str)
        cai_series = nonempty(view["cai_trend"]) if "cai_trend" in view.columns else pd.Series(dtype=str)
        quadrant_series = nonempty(view["quadrant"].astype(str)) if "quadrant" in view.columns else pd.Series(dtype=str)

        important_types = {"重要價值會員", "重要保持會員", "重要發展會員", "重要挽留會員"}
        c1, c2, c3, c4, c5 = st.columns(5)
        c1.metric("顧客總數", len(customers))
        c2.metric("篩選結果", len(view))
        c3.metric("重要會員", int(rfm_series.isin(important_types).sum()))
        c4.metric("活躍 (CAI)", int((cai_series == "活躍").sum()))
        c5.metric("沉寂 (CAI)", int((cai_series == "沉寂").sum()))

        if not orders.empty:
            completed_orders = orders[orders["status"] == "已完成"]
            rfm_orders = completed_orders if not completed_orders.empty else orders[orders["status"] != "已取消"]
            rfm_values = compute_customer_rfm_values(rfm_orders)
            if not rfm_values.empty and "id" in view.columns:
                customer_cols = [
                    col
                    for col in ["id", "name", "rfm_member_type", "cai_trend", "quadrant"]
                    if col in view.columns
                ]
                plot_df = rfm_values.merge(
                    view[customer_cols],
                    left_on="customer_id",
                    right_on="id",
                    how="inner",
                )
                if not plot_df.empty:
                    plot_df["顧客"] = plot_df.get("name", plot_df["customer_id"]).fillna(plot_df["customer_id"])
                    cai_source = (
                        plot_df["cai_trend"]
                        if "cai_trend" in plot_df.columns
                        else pd.Series("未分類", index=plot_df.index)
                    )
                    plot_df["CAI"] = cai_source.replace("", pd.NA).fillna("未分類")
                    plot_df["M值"] = pd.to_numeric(plot_df["M值"], errors="coerce").fillna(0)
                    plot_df["F值"] = pd.to_numeric(plot_df["F值"], errors="coerce").fillna(0)
                    plot_df["R值"] = pd.to_numeric(plot_df["R值"], errors="coerce").fillna(0)

                    st.subheader("RFM／CAI 3D 象限圖")
                    fig = px.scatter_3d(
                        plot_df,
                        x="R值",
                        y="F值",
                        z="M值",
                        color="CAI",
                        color_discrete_map=CAI_COLOR_MAP,
                        category_orders={"CAI": ["沉寂", "固定", "活躍", "未分類"]},
                        hover_name="顧客",
                        hover_data={
                            "customer_id": True,
                            "最後訂購時間": True,
                            "R值": ":.0f",
                            "F值": ":.0f",
                            "M值": ":,.0f",
                            "CAI": True,
                        },
                        labels={
                            "R值": "R值：距今未購買天數",
                            "F值": "F值：訂購次數",
                            "M值": "M值：累計訂購金額",
                        },
                    )
                    add_rfm_quadrant_planes(fig, plot_df)
                    fig.update_traces(marker=dict(size=6), selector=dict(mode="markers"))
                    fig.update_layout(
                        height=620,
                        margin=dict(l=0, r=0, t=10, b=0),
                        scene=dict(
                            xaxis_title="R值：距今未購買天數",
                            yaxis_title="F值：訂購次數",
                            zaxis_title="M值：累計訂購金額",
                        ),
                        legend_title_text="CAI",
                    )
                    st.plotly_chart(fig, use_container_width=True)

        if not rfm_series.empty or not cai_series.empty or not quadrant_series.empty:
            st.subheader("RFM／CAI／象限分佈")
            col_r, col_c, col_q = st.columns(3)
            with col_r:
                st.caption("RFM 會員類型")
                if not rfm_series.empty:
                    rfm_counts = rfm_series.value_counts().reset_index()
                    rfm_counts.columns = ["RFM會員類型", "人數"]
                    fig = px.bar(rfm_counts, x="人數", y="RFM會員類型", orientation="h")
                    fig.update_layout(
                        height=320,
                        margin=dict(l=0, r=0, t=10, b=0),
                        yaxis={"categoryorder": "total ascending"},
                    )
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.info("無資料")
            with col_c:
                st.caption("CAI 購買行為趨勢")
                if not cai_series.empty:
                    cai_counts = cai_series.value_counts().reset_index()
                    cai_counts.columns = ["CAI購買行為趨勢", "人數"]
                    fig = px.pie(cai_counts, names="CAI購買行為趨勢", values="人數", hole=0.4)
                    fig.update_layout(height=320, margin=dict(l=0, r=0, t=10, b=0))
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.info("無資料")
            with col_q:
                st.caption("象限分類")
                if not quadrant_series.empty:
                    q_counts = quadrant_series.value_counts().reset_index()
                    q_counts.columns = ["象限", "人數"]
                    q_counts = q_counts.sort_values("象限")
                    fig = px.bar(q_counts, x="象限", y="人數")
                    fig.update_layout(height=320, margin=dict(l=0, r=0, t=10, b=0))
                    st.plotly_chart(fig, use_container_width=True)
                else:
                    st.info("無資料")

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
        column_rename = {
            "id": "顧客ID",
            "name": "姓名",
            "birthday": "生日",
            "phone": "電話",
            "email": "Email",
            "occupation": "職業",
            "gender": "性別",
            "income_range": "月收入區間",
            "household_size": "同住人口數",
            "note": "附註",
            "rfm_member_type": "RFM會員類型",
            "cai_trend": "CAI購買行為趨勢",
            "quadrant": "象限分類",
        }
        ordered_cols = [c for c in column_rename.keys() if c in view.columns]
        display_view = view[ordered_cols].rename(columns=column_rename) if ordered_cols else view
        st.dataframe(display_view, use_container_width=True, hide_index=True)

        st.divider()
        with st.expander("📘 RFM 會員類型對照表", expanded=False):
            st.caption(
                "RFM 三碼分別代表 Recency（近期消費）／Frequency（消費頻率）／Monetary（消費金額）；"
                "1 為低於平均、2 為高於平均。"
            )
            st.dataframe(
                pd.DataFrame(RFM_MEMBER_TYPES),
                use_container_width=True,
                hide_index=True,
            )

        with st.expander("📗 CAI 購買行為趨勢說明", expanded=False):
            st.markdown(
                "**CAI（Customer Activity Index）** 衡量顧客回購節奏的變化趨勢：越「活躍」"
                "代表該顧客回購的時間間隔越來越短；越「沉寂」則代表回購間隔越來越長。"
            )
            cai_table = pd.DataFrame(
                [{"趨勢": k, "說明": v} for k, v in CAI_TREND_DESCRIPTION.items()]
            )
            st.dataframe(cai_table, use_container_width=True, hide_index=True)

st.sidebar.caption(f"資料快取 120 秒｜{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
