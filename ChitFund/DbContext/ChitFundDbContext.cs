using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ChitFund.Repositories;
using System.Data;
using ServiceStack.OrmLite;

namespace ChitFund.DbContext
{
    public class ChitFundDbContext : IDisposable
    {
        private bool disposed;
        private IDbConnection db;

        static ChitFundDbContext()
        {
            OrmLiteConfig.DialectProvider = SqliteDialect.Provider;
        }

        public ChitFundDbContext(string connection)
        {
            db = connection.OpenDbConnection();
            Contacts = new ContactRep(db);           
        }

        public ContactRep Contacts { get; private set; }

        public void Dispose()
        {
            if (!disposed)
            {
                disposed = true;
                db.Dispose();
                db = null;
            }
        }
    }
}