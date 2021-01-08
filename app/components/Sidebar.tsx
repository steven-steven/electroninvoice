/* eslint-disable react/jsx-one-expression-per-line */
import React from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';

export default function Sidebar(): JSX.Element {
  return (
    <div className="fixed w-56 min-h-screen bg-white">
      <div className="flex items-center h-16 px-6 text-lg text-center text-blue-600">
        <span className="pr-2 text-2xl">dP</span> Invoice App
      </div>
      <div className="sidebar-icons">
        <Link to={routes.INVOICE}>
          <div className="flex items-center h-16 px-8 py-2 border-t-2 border-b-2 cursor-pointer sidebar-icon text-sidebarText hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="fas fa-landmark fa-sm" />
            </span>
            <div className="pl-5">Sejarah</div>
          </div>
        </Link>
        <Link to={routes.ADDINVOICE}>
          <div className="flex items-center h-16 px-8 py-2 border-b-2 cursor-pointer sidebar-icon text-sidebarText hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="far fa-plus-square fa-sm" />
            </span>
            <div className="pl-5">Buat Invoice</div>
          </div>
        </Link>
        <Link to={routes.DAFTARBARANG}>
          <div className="flex items-center h-16 px-8 py-2 border-b-2 cursor-pointer sidebar-icon text-sidebarText hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="fas fa-clipboard-list fa-sm" />
            </span>
            <div className="pl-5">Daftar Barang</div>
          </div>
        </Link>
        <Link to={routes.CUSTOMER}>
          <div className="flex items-center h-16 px-8 py-2 border-b-2 cursor-pointer sidebar-icon text-sidebarText hover:bg-indigo-200 hover:bg-opacity-50">
            <span>
              <i className="fas fa-clipboard-list fa-sm" />
            </span>
            <div className="pl-5">Daftar Customer</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
