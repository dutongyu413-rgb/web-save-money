import { Database, DownloadSimple, Globe, ShieldCheck } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";

export function LocalInfoPage() {
  const navigate = useNavigate();
  return (
    <section className="screen info-screen">
      <ScreenHeader title="数据存储说明" backTo="/settings" />
      <div className="screen-scroll">
        <div className="info-hero"><span><Database /></span><h2>数据只在当前浏览器</h2><p>应用代码由静态地址提供，收入、储蓄和设置不会上传到业务服务器。</p></div>
        <div className="info-list">
          <article><ShieldCheck /><div><h3>刷新通常不会丢失</h3><p>正常刷新、关闭浏览器或重启设备，IndexedDB 中的数据通常仍会保留。</p></div></article>
          <article><Globe /><div><h3>不同地址彼此独立</h3><p>更换设备、浏览器、域名、协议或端口后，原地址的数据不会自动出现。</p></div></article>
          <article><DownloadSimple /><div><h3>定期导出备份</h3><p>清理网站数据、无痕模式、卸载浏览器或系统清理都可能导致数据丢失。</p></div></article>
        </div>
        <p className="helper-note"><ShieldCheck />加密只用于导出的备份文件。本机数据库不会要求你每次输入密码。</p>
        <button className="button primary full" type="button" onClick={() => navigate("/settings/export")}>导出加密备份</button>
      </div>
    </section>
  );
}
