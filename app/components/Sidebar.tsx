import React from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';

export default function Sidebar(): JSX.Element {
  return (
    <div className="w-56 bg-white fixed min-h-screen">
      <div className="h-16 px-6 text-center text-lg text-blue-600 flex items-center">
        <span className="text-2xl">dP</span> &nbsp; Invoice App
      </div>
      <div className="sidebar-icons">
        <Link to={routes.INVOICE}>
          <div className="sidebar-icon flex items-center px-8 py-2 h-16 border-t-2 border-b-2 text-sidebarText cursor-pointer hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="fas fa-landmark fa-sm" />
            </span>
            <div className="pl-5">Sejarah</div>
          </div>
        </Link>
        <Link to={routes.ADDINVOICE}>
          <div className="sidebar-icon flex items-center px-8 py-2 h-16 border-b-2 text-sidebarText cursor-pointer hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="far fa-plus-square fa-sm" />
            </span>
            <div className="pl-5">Buat Invoice</div>
          </div>
        </Link>
        <Link to={routes.DAFTARBARANG}>
          <div className="sidebar-icon flex items-center px-8 py-2 h-16 border-b-2 text-sidebarText cursor-pointer hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="fas fa-clipboard-list fa-sm" />
            </span>
            <div className="pl-5">Daftar Barang</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
